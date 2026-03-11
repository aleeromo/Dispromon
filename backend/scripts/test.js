
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const ws = await prisma.workspace.findFirst();
  console.log('WS', ws.id);
  const root = await prisma.folder.create({ data: { workspaceId: ws.id, name: 'Root2026', position: 0 } });
  console.log('Root:', root.id);
  const sub = await prisma.folder.create({ data: { workspaceId: ws.id, name: 'Marzo', position: 0, parentId: root.id } });
  console.log('Sub:', sub.id);
  const folders = await prisma.folder.findMany({ where: { workspaceId: ws.id } });
  console.log(folders);
}
run().catch(console.error).finally(()=>prisma.\());
