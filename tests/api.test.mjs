import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, FutureApiClient } from '../src/api.js';
import { FutureRemoteRepository } from '../src/remote-repository.js';

const baseUrl='https://api.example.invalid';
const response=({ok=true,status=200,value={},requestId=null}={})=>({
  ok,status,headers:{get:name=>name.toLowerCase()==='x-request-id'?requestId:null},json:async()=>value,
});
const client=options=>new FutureApiClient({enabled:true,baseUrl,fetcher:async()=>response(),...options});

test('API is disabled by default with zero token or network calls',async()=>{
  let tokens=0,calls=0;
  const api=new FutureApiClient({baseUrl,accessToken:()=>tokens++,fetcher:()=>calls++});
  await assert.rejects(api.request('/v1/units'),error=>error.code==='API_NOT_CONNECTED');
  assert.equal(tokens,0); assert.equal(calls,0);
});

test('unsafe API configuration and paths fail before network',async()=>{
  const cases=[
    ['http://example.invalid','/v1/units'],['https://user@example.invalid','/v1/units'],
    [baseUrl,'https://evil.invalid/v1/units'],[baseUrl,'/v1/../private'],[baseUrl,'/v1/%2e%2e/private'],
  ];
  for (const [url,path] of cases) {
    let calls=0; const api=new FutureApiClient({enabled:true,baseUrl:url,fetcher:()=>calls++});
    await assert.rejects(api.request(path),error=>error.code==='INVALID_API_CONFIG'); assert.equal(calls,0);
  }
});

test('mock write passes memory token, idempotency and revision once without credentials mode',async()=>{
  let calls=0;
  const api=client({accessToken:async()=>'memory-only',fetcher:async(url,options)=>{
    calls++; assert.equal(url,`${baseUrl}/v1/trips/trip/items/item`);
    assert.equal(options.credentials,'omit'); assert.equal(options.redirect,'error');
    assert.equal(options.headers.Authorization,'Bearer memory-only');
    assert.equal(options.headers['Idempotency-Key'],'mutation-1'); assert.equal(options.headers['If-Match'],'revision-3');
    assert.deepEqual(JSON.parse(options.body),{startTime:'10:00'});
    return response({value:{revision:'revision-4'}});
  }});
  assert.deepEqual(await api.request('/v1/trips/trip/items/item',{method:'PATCH',body:{startTime:'10:00'},idempotencyKey:'mutation-1',revision:'revision-3'}),{revision:'revision-4'});
  assert.equal(calls,1);
});

test('writes require safe idempotency and revision headers before mock transport',async()=>{
  let calls=0; const api=client({fetcher:async()=>{calls++;return response();}});
  await assert.rejects(api.request('/v1/trips',{method:'POST',body:{}}),error=>error.code==='IDEMPOTENCY_KEY_REQUIRED');
  await assert.rejects(api.request('/v1/trips/a/items/b',{method:'PATCH',body:{},idempotencyKey:'one'}),error=>error.code==='REVISION_REQUIRED');
  await assert.rejects(api.request('/v1/trips',{method:'POST',body:{},idempotencyKey:'bad\nheader'}),error=>error.code==='IDEMPOTENCY_KEY_REQUIRED');
  assert.equal(calls,0);
});

test('authentication provider failures and unsafe tokens do not reach mock transport',async()=>{
  for (const accessToken of [()=>{throw Error('secret detail');},()=> 'bad\r\ntoken']) {
    let calls=0; const api=client({accessToken,fetcher:async()=>{calls++;return response();}});
    await assert.rejects(api.request('/v1/units'),error=>['AUTH_REQUIRED','INVALID_AUTH_TOKEN'].includes(error.code) && error.message===error.code);
    assert.equal(calls,0);
  }
});

test('HTTP status families become stable errors without reading response bodies',async()=>{
  const cases=[[401,'AUTH_REQUIRED',false],[403,'FORBIDDEN',false],[404,'NOT_FOUND',false],[409,'REVISION_CONFLICT',false],[412,'REVISION_CONFLICT',false],[429,'RATE_LIMITED',true],[503,'SERVER_UNAVAILABLE',true],[422,'HTTP_ERROR',false]];
  for (const [status,code,retryable] of cases) {
    let bodyReads=0;
    const api=client({fetcher:async()=>({...response({ok:false,status,requestId:'request-safe'}),json:async()=>{bodyReads++;throw Error('raw server secret');}})});
    await assert.rejects(api.request('/v1/units'),error=>error instanceof ApiError && error.code===code && error.status===status && error.retryable===retryable && error.requestId==='request-safe' && !error.message.includes('secret'));
    assert.equal(bodyReads,0);
  }
});

test('unsafe request IDs are dropped from errors',async()=>{
  const api=client({fetcher:async()=>response({ok:false,status:500,requestId:'bad request id\n'})});
  await assert.rejects(api.request('/v1/units'),error=>error.code==='SERVER_UNAVAILABLE' && error.requestId===null);
});

test('an already aborted request never reaches mock transport',async()=>{
  const controller=new AbortController(); controller.abort(); let calls=0;
  const api=client({fetcher:async()=>{calls++;return response();}});
  await assert.rejects(api.request('/v1/units',{signal:controller.signal}),error=>error.code==='REQUEST_ABORTED');
  assert.equal(calls,0);
});

test('caller cancellation aborts one in-flight mock request without retry',async()=>{
  let calls=0;
  let started; const didStart=new Promise(resolve=>{started=resolve;});
  const api=client({fetcher:async(_url,{signal})=>new Promise((resolve,reject)=>{
    calls++; started(); signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});
  })});
  const controller=new AbortController();
  const pending=api.request('/v1/units',{signal:controller.signal}); await didStart; controller.abort();
  await assert.rejects(pending,error=>error.code==='REQUEST_ABORTED' && !error.retryable); assert.equal(calls,1);
});

test('timeout aborts one mock request and is marked retryable without auto-retry',async()=>{
  let calls=0;
  const api=client({timeoutMs:10,fetcher:async(_url,{signal})=>new Promise((resolve,reject)=>{
    calls++; signal.addEventListener('abort',()=>reject(Error('timeout')),{once:true});
  })});
  await assert.rejects(api.request('/v1/units'),error=>error.code==='REQUEST_TIMEOUT' && error.retryable); assert.equal(calls,1);
});

test('network and malformed JSON failures are normalized and never retried',async()=>{
  let calls=0;
  const network=client({fetcher:async()=>{calls++;throw Error('host detail');}});
  await assert.rejects(network.request('/v1/units'),error=>error.code==='NETWORK_ERROR' && error.retryable && error.message==='NETWORK_ERROR');
  assert.equal(calls,1);
  const malformed=client({fetcher:async()=>({...response(),json:async()=>{throw Error('invalid body content');}})});
  await assert.rejects(malformed.request('/v1/units'),error=>error.code==='INVALID_RESPONSE' && error.message==='INVALID_RESPONSE');
});

test('204 returns no value and does not attempt JSON parsing',async()=>{
  let reads=0; const api=client({fetcher:async()=>({...response({status:204}),json:async()=>{reads++;}})});
  assert.equal(await api.request('/v1/units'),undefined); assert.equal(reads,0);
});

test('remote trip boundary sends only future contract fields through its injected mock',async()=>{
  const calls=[]; const repository=new FutureRemoteRepository({request:async(path,options)=>{calls.push({path,options});return {id:'server-trip'};}});
  const result=await repository.createTrip({
    name:'  Synthetic trip  ',startDate:'2026-10-01',endDate:'2026-10-02',region:{country:'KR',city:'seoul',district:'seongsu'},
    records:{private:'drop'},translationVariants:[{private:'drop'}],note:'drop',visibility:'public',
  },{idempotencyKey:'trip-create'});
  assert.deepEqual(result,{id:'server-trip'});
  assert.deepEqual(calls[0],{path:'/v1/trips',options:{method:'POST',body:{name:'Synthetic trip',startDate:'2026-10-01',endDate:'2026-10-02',region:{country:'KR',city:'seoul',district:'seongsu'}},idempotencyKey:'trip-create',signal:undefined}});
});

test('remote item boundary excludes snapshots, private records and translation drafts',async()=>{
  const calls=[]; const repository=new FutureRemoteRepository({request:async(path,options)=>{calls.push({path,options});return {};}});
  await repository.addTripItem('trip-one',{
    date:'2026-10-01',startTime:'09:00',unitId:'unit-one',unitVersionId:'unit-v1',
    snapshot:{private:'drop'},note:'drop',translationDraft:{private:'drop'},
  },{idempotencyKey:'add-one'});
  assert.deepEqual(calls[0].options.body,{date:'2026-10-01',startTime:'09:00',unitId:'unit-one',unitVersionId:'unit-v1'});
});

test('remote schedule patch allowlist preserves revision and rejects identity edits',async()=>{
  const calls=[]; const repository=new FutureRemoteRepository({request:async(path,options)=>{calls.push({path,options});return {};}});
  await repository.updateTripItem('trip-one','item-one',{startTime:'10:15',durationMinutes:45,movementMinutes:5,breakMinutes:0},{idempotencyKey:'edit-one',revision:'rev-2'});
  assert.deepEqual(calls[0],{path:'/v1/trips/trip-one/items/item-one',options:{method:'PATCH',body:{startTime:'10:15',durationMinutes:45,movementMinutes:5,breakMinutes:0},idempotencyKey:'edit-one',revision:'rev-2',signal:undefined}});
  assert.throws(()=>repository.updateTripItem('trip-one','item-one',{unitId:'replace'}),/invalidRemoteInput/);
  assert.equal(calls.length,1);
});

test('remote record and identifiers validate before the injected mock is called',async()=>{
  const calls=[]; const repository=new FutureRemoteRepository({request:async(path,options)=>{calls.push({path,options});return {};}});
  await repository.saveExperienceRecord('trip','item',{checkedIds:['point-one'],note:'Private owner note',skipped:false},{idempotencyKey:'record-one',revision:'rev-4'});
  assert.deepEqual(calls[0],{path:'/v1/trips/trip/items/item/record',options:{method:'PUT',body:{checkedIds:['point-one'],note:'Private owner note',skipped:false},idempotencyKey:'record-one',revision:'rev-4',signal:undefined}});
  assert.throws(()=>repository.getUnit('../unit','v1'),/invalidRemoteInput/);
  assert.throws(()=>repository.createTrip({name:'x',startDate:'2026-02-30',endDate:'2026-03-01',region:{country:'KR',city:'seoul',district:'seongsu'}}),/invalidRemoteInput/);
  assert.throws(()=>repository.saveExperienceRecord('trip','item',{checkedIds:['one','one'],note:'',skipped:false}),/invalidRemoteInput/);
  assert.equal(calls.length,1);
});

test('remote discovery query uses only manual region and explicit locale',async()=>{
  let seen; const repository=new FutureRemoteRepository({request:async(path,options)=>{seen={path,options};return {items:[],nextCursor:null};}});
  await repository.listUnits({region:{country:'KR',city:'seoul',district:'seongsu'},locale:'ko',query:'forest'});
  const url=new URL(seen.path,'https://local.invalid');
  assert.equal(url.pathname,'/v1/units'); assert.deepEqual(Object.fromEntries(url.searchParams),{country:'KR',city:'seoul',district:'seongsu',locale:'ko',q:'forest'});
  assert.deepEqual(seen.options,{signal:undefined});
});
