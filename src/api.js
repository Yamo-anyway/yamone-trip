// Preparation only. This adapter is not imported by app.js; no live API calls are made.
export class ApiError extends Error {
  constructor(code,status=0) { super(code); this.code=code; this.status=status; }
}
export class FutureApiClient {
  constructor({baseUrl='',enabled=false,fetcher=globalThis.fetch,accessToken=()=>null}={}) {
    this.baseUrl=baseUrl.replace(/\/$/,''); this.enabled=enabled; this.fetcher=fetcher; this.accessToken=accessToken;
  }
  async request(path,{method='GET',body,signal,idempotencyKey}={}) {
    if (!this.enabled) throw new ApiError('API_NOT_CONNECTED');
    let base;
    try { base=new URL(this.baseUrl); } catch { throw new ApiError('INVALID_API_CONFIG'); }
    if (base.protocol!=='https:' || base.username || base.password || base.search || base.hash || !['','/'].includes(base.pathname) || !path.startsWith('/v1/') || /\.\.|#|\\|%2e|%2f|%5c/i.test(path)) throw new ApiError('INVALID_API_CONFIG');
    const headers={'Accept':'application/json'};
    const token=this.accessToken();
    if(token) headers.Authorization=`Bearer ${token}`;
    if(body!==undefined) headers['Content-Type']='application/json';
    if(idempotencyKey) headers['Idempotency-Key']=idempotencyKey;
    const res=await this.fetcher(this.baseUrl+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',redirect:'error',signal});
    if(!res.ok) throw new ApiError('HTTP_ERROR',res.status);
    if(res.status===204) return undefined;
    return res.json();
  }
}
