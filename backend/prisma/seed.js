import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.itemValue.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.board.deleteMany({});

  const adminUsername = 'admin';
  let admin = await prisma.user.findUnique({ where: { nombre: adminUsername } });
  if (!admin) {
    const hash = await bcrypt.hash('123456', 10);
    admin = await prisma.user.create({
      data: {
        nombre: adminUsername,
        password: hash,
        rol: 'ADMIN',
      },
    });
    console.log('Usuario admin creado:', admin.nombre);
  }

  let ws = await prisma.workspace.findFirst({ where: { name: 'PROYECTOS' } });
  if (!ws) {
    ws = await prisma.workspace.create({
      data: { name: 'PROYECTOS', categoria_raiz: 'PROYECTOS' },
    });
    console.log('Workspace PROYECTOS creado');
  }

  console.log('Seed OK. Boards eliminados. Navegación por Meses y Clientes.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
