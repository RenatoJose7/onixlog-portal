// Cria credenciais locais únicas; não faça commit do arquivo gerado.
import { randomBytes } from 'node:crypto';
import { writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const file=resolve(process.cwd(),'.env.local');
try {await access(file);console.error('O arquivo .env.local já existe. Não foi sobrescrito.');process.exit(1);}catch(e){if(e.code!=='ENOENT')throw e;}
const password=randomBytes(18).toString('base64url');
const secret=randomBytes(48).toString('hex');
const env=`ADMIN_PASSWORD=${password}\nSESSION_SECRET=${secret}\nSUPABASE_URL=\nSUPABASE_SECRET_KEY=\nPORT=3000\n`;
await writeFile(file,env,{mode:0o600,flag:'wx'});
console.log('\nConfiguração local criada com sucesso.');
console.log('Senha de administrador (guarde em um gerenciador de senhas):');
console.log(password);
console.log('\nAcesse: http://localhost:3000/admin\n');
