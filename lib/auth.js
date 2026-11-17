import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const COOKIE='onixlog_session';
const TTL = 60*60*8;

function sign(message) {
  const secret=process.env.SESSION_SECRET;
  if (!secret || secret.length<32) throw Error('SESSION_SECRET não foi configurado corretamente.');
  return createHmac('sha256',secret).update(message).digest('base64url');
}
function safeEqual(a,b) {
  const x=Buffer.from(String(a)); const y=Buffer.from(String(b));
  return x.length===y.length && timingSafeEqual(x,y);
}
export function credentialsReady() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length>=12 && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length>=32);
}
export function passwordValid(submitted) {
  if (!credentialsReady() || typeof submitted!=='string') return false;
  return safeEqual(sign('pwd:'+submitted),sign('pwd:'+process.env.ADMIN_PASSWORD));
}
export function cookieForLogin() {
  const expiry=Math.floor(Date.now()/1000)+TTL;
  const token=`v1.${expiry}.${randomBytes(12).toString('hex')}`;
  return `${COOKIE}=${token}.${sign(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL}${process.env.NODE_ENV==='production'||process.env.VERCEL?'; Secure':''}`;
}
export function cookieForLogout() {return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV==='production'||process.env.VERCEL?'; Secure':''}`;}
export function authenticated(req) {
  if (!credentialsReady()) return false;
  const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const value=raw.slice(COOKIE.length+1);
  const dot=value.lastIndexOf('.');
  if (dot<1) return false;
  const token=value.slice(0,dot), sig=value.slice(dot+1);
  const fields=token.split('.');
  return fields.length===3 && fields[0]==='v1' && Number(fields[1])>Date.now()/1000 && safeEqual(sig,sign(token));
}
