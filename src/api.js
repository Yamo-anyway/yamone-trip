// Preparation only. Native/web apps do not import this module and no origin is configured.
const writeMethods=new Set(['POST','PATCH','PUT','DELETE']);
const revisionMethods=new Set(['PATCH','PUT','DELETE']);
const headerValue=/^[\x21-\x7e]{1,256}$/;

export class ApiError extends Error {
  constructor(code,{status=0,requestId=null,retryable=false}={}) {
    super(code); this.name='ApiError'; this.code=code; this.status=status;
    this.requestId=requestId; this.retryable=retryable;
  }
}

function safeHeader(value,code) {
  if (typeof value!=='string' || !headerValue.test(value)) throw new ApiError(code);
  return value;
}

function safeRequestId(response) {
  const value=response?.headers?.get?.('x-request-id');
  return typeof value==='string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value)?value:null;
}

function errorForStatus(status,requestId) {
  if (status===401) return new ApiError('AUTH_REQUIRED',{status,requestId});
  if (status===403) return new ApiError('FORBIDDEN',{status,requestId});
  if (status===404) return new ApiError('NOT_FOUND',{status,requestId});
  if (status===409 || status===412) return new ApiError('REVISION_CONFLICT',{status,requestId});
  if (status===429) return new ApiError('RATE_LIMITED',{status,requestId,retryable:true});
  if (status>=500) return new ApiError('SERVER_UNAVAILABLE',{status,requestId,retryable:true});
  return new ApiError('HTTP_ERROR',{status,requestId});
}

function targetUrl(baseUrl,path) {
  let base,target;
  try { base=new URL(baseUrl); target=new URL(path,base); } catch { throw new ApiError('INVALID_API_CONFIG'); }
  const cleanBasePath=['','/'].includes(base.pathname) && !base.search && !base.hash;
  const cleanPath=path.startsWith('/v1/') && target.origin===base.origin && target.pathname.startsWith('/v1/') &&
    !/\.{2}|\\|%2e|%2f|%5c/i.test(path) && !target.hash;
  if (base.protocol!=='https:' || base.username || base.password || !cleanBasePath || !cleanPath) throw new ApiError('INVALID_API_CONFIG');
  return target.href;
}

export class FutureApiClient {
  constructor({baseUrl='',enabled=false,fetcher=globalThis.fetch,accessToken=()=>null,timeoutMs=10000}={}) {
    this.baseUrl=baseUrl.replace(/\/$/,''); this.enabled=enabled; this.fetcher=fetcher;
    this.accessToken=accessToken; this.timeoutMs=timeoutMs;
  }

  async request(path,{method='GET',body,signal,idempotencyKey,revision}={}) {
    if (!this.enabled) throw new ApiError('API_NOT_CONNECTED');
    method=String(method).toUpperCase();
    if (!['GET','POST','PATCH','PUT','DELETE'].includes(method) || (method==='GET' && body!==undefined)) throw new ApiError('INVALID_REQUEST');
    const url=targetUrl(this.baseUrl,path);
    const headers={Accept:'application/json'};
    let token;
    try { token=await this.accessToken(); }
    catch { throw new ApiError('AUTH_REQUIRED'); }
    if (token!==null && token!==undefined && token!=='') headers.Authorization=`Bearer ${safeHeader(token,'INVALID_AUTH_TOKEN')}`;
    if (body!==undefined) headers['Content-Type']='application/json';
    if (writeMethods.has(method)) headers['Idempotency-Key']=safeHeader(idempotencyKey,'IDEMPOTENCY_KEY_REQUIRED');
    if (revisionMethods.has(method)) headers['If-Match']=safeHeader(revision,'REVISION_REQUIRED');
    let encodedBody;
    try { encodedBody=body===undefined?undefined:JSON.stringify(body); }
    catch { throw new ApiError('INVALID_REQUEST'); }

    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs<1 || this.timeoutMs>120000 || typeof this.fetcher!=='function') throw new ApiError('INVALID_API_CONFIG');
    if (signal?.aborted) throw new ApiError('REQUEST_ABORTED');
    const controller=new AbortController();
    let timedOut=false;
    const abort=()=>controller.abort(signal?.reason);
    signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},this.timeoutMs);
    let response;
    try {
      response=await this.fetcher(url,{method,headers,body:encodedBody,credentials:'omit',redirect:'error',signal:controller.signal});
    } catch {
      if (timedOut) throw new ApiError('REQUEST_TIMEOUT',{retryable:true});
      if (signal?.aborted || controller.signal.aborted) throw new ApiError('REQUEST_ABORTED');
      throw new ApiError('NETWORK_ERROR',{retryable:true});
    } finally {
      clearTimeout(timer); signal?.removeEventListener('abort',abort);
    }
    if (!response || typeof response.ok!=='boolean' || !Number.isInteger(response.status)) throw new ApiError('INVALID_RESPONSE');
    const requestId=safeRequestId(response);
    if (!response.ok) throw errorForStatus(response.status,requestId);
    if (response.status===204) return undefined;
    if (typeof response.json!=='function') throw new ApiError('INVALID_RESPONSE',{status:response.status,requestId});
    try { return await response.json(); }
    catch { throw new ApiError('INVALID_RESPONSE',{status:response.status,requestId}); }
  }
}
