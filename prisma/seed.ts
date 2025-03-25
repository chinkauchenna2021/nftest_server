// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Helper functions
const generateWalletAddress = (prefix: string) => 
  `${prefix}${uuidv4().replace(/-/g, '').slice(0, 34)}`;

const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function main() {
  // Clean existing data
  await prisma.$transaction([
    prisma.$executeRaw`TRUNCATE TABLE 
      "User", 
      "Profile", 
      "NFT", 
      "Collection", 
      "Sale", 
      "Notification", 
      "Message", 
      "Yield", 
      "Wallet" 
      CASCADE`
  ]);

  // Create Users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(async (_, i) => {
      const isAdmin = i === 0;
      return prisma.user.create({
        data: {
          email: `user${i}@example.com`,
          password: await hash('Password123!', SALT_ROUNDS),
          role: isAdmin ? Role.ADMIN : Role.USER,
          walletAddress: generateWalletAddress('0x'),
          profile: {
            create: {
              bio: `Digital artist and collector #${i}`,
              avatar: `https://i.pravatar.cc/300?img=${i}`,
              banner: `https://picsum.photos/seed/banner${i}/800/200`
            }
          },
          notifications: {
            create: Array.from({ length: 3 }).map((_, j) => ({
              title: `Notification ${j + 1}`,
              message: `Important update for user ${i}`,
            }))
          },
          messages: {
            create: Array.from({ length: 2 }).map((_, j) => ({
              content: `Message ${j + 1} for user ${i}`,
            }))
          }
        },
        include: { profile: true, notifications: true, messages: true }
      });
    })
  );

  // Create NFTs
  const nfts = await Promise.all(
    Array.from({ length: 20 }).map((_, i) => {
      const creator = users[i % users.length];
      return prisma.nFT.create({
        data: {
          name: `Digital Art #${i + 1}`,
          image: `https://picsum.photos/seed/nft${i}/600/400`,
          logo: `https://picsum.photos/seed/logo${i}/100/100`,
          description: `Unique digital artwork #${i + 1}`,
          price: Math.floor(Math.random() * 100) + 0.99,
          creatorId: creator.id,
          collections: {
            create: Array.from({ length: 2 }).map((_, j) => ({
              name: `Collection ${i}-${j}`,
              price: Math.floor(Math.random() * 50) + 0.95,
              resaleProfit: Math.floor(Math.random() * 20) + 5,
              chartAmount: Math.floor(Math.random() * 10000),
              image: `https://picsum.photos/seed/collection${i}-${j}/600/400`,
              creatorContract: generateWalletAddress('0x'),
              owner: creator.walletAddress!,
              chain: ['Ethereum', 'Polygon', 'Binance'][j % 3],
              timezone: 'UTC',
              tokenId: uuidv4()
            }))
          }
        },
        include: { collections: true }
      });
    })
  );

  // Create Sales
  await Promise.all(
    Array.from({ length: 50 }).map(async (_, i) => {
      const nft = nfts[i % nfts.length];
      const buyer = users[(i + 1) % users.length];
      
      return prisma.sale.create({
        data: {
          price: nft.price * (Math.random() * 0.5 + 0.75),
          soldAt: randomDate(new Date(2023, 0, 1), new Date()),
          nftId: nft.id,
          buyerId: buyer.id
        }
      });
    })
  );

  // Create Yields
  await prisma.yield.createMany({
    data: Array.from({ length: 5 }).map((_, i) => ({
      image: `https://picsum.photos/seed/yield${i}/300/200`,
      imageLg: `https://picsum.photos/seed/yield-lg${i}/600/400`,
      title: `Yield Opportunity ${i + 1}`,
      amountRange: `$${(i + 1) * 1000}-${(i + 1) * 5000}`,
      chartPercent: `${Math.floor(Math.random() * 30) + 70}%`,
      income: `$${Math.floor(Math.random() * 1000) + 500}/month`,
      fee: `${Math.floor(Math.random() * 3) + 1}%`,
      level: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
      days: `${Math.floor(Math.random() * 30) + 30} days`
    }))
  });

  // Create Wallets
  await prisma.wallet.createMany({
    data: users.map(user => ({
      usdtBtc20: generateWalletAddress('bc1q'),
      usdtTrc20: generateWalletAddress('T'),
      usdtDefault: Math.random() > 0.5 ? generateWalletAddress('0x') : null
    }))
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created:
  - Users: ${users.length}
  - NFTs: ${nfts.length}
  - Sales: 50
  - Yields: 5
  - Wallets: ${users.length}`);
}

main()
  .catch(async (e) => {
    console.error('Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });