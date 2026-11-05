/** Unreleased artwork can be reviewed locally without changing public or room access. */
export function isLocalStageFivePreview({hostname='',search=''}={}){
  return ['localhost','127.0.0.1','[::1]','::1'].includes(hostname.toLowerCase())&&new URLSearchParams(search).get('preview')==='5';
}
