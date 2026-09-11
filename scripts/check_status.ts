import { RealTVSAuctionProvider } from '../src/lib/services/tvs-integration';
import { prisma } from '../src/lib/db';
import { syncLiveAuction } from '../src/lib/services/tvs-sync';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  console.log('=== 1. CHECKING DATABASE STATE ===');
  const dealerCount = await prisma.dealer.count();
  console.log(`Dealers in DB: ${dealerCount}`);

  const campaigns = await prisma.campaign.findMany({
    include: { matchDays: true, rules: true },
  });
  console.log(`Campaigns found: ${campaigns.length}`);
  for (const c of campaigns) {
    console.log(`Campaign: ${c.name} (${c.type}, Status: ${c.status})`);
    console.log(`  Match Days: ${c.matchDays.length}`);
    for (const m of c.matchDays) {
      console.log(`    Match #${m.matchNumber}: Date ${m.date.toISOString()}, AuctionId: ${m.auctionId}, Status: ${m.status}`);
    }
    console.log(`  Point Rules: ${c.rules.length}`);
    for (const r of c.rules) {
      console.log(`    Rule ${r.activityType}: ${r.points} pts (Active: ${r.active})`);
    }
  }

  const activityCount = await prisma.dealerActivity.count();
  console.log(`Dealer Activities recorded so far: ${activityCount}`);

  console.log('\n=== 2. CHECKING TVS CERTIFIED API CONNECTIVITY ===');
  const provider = new RealTVSAuctionProvider();

  console.log('Attempting authentication with bhavaniprasad999@gmail.com...');
  const authRes = await provider.authenticateWithCredentials('bhavaniprasad999@gmail.com', 'KU9JhpWDCz');
  console.log('Auth result:', {
    authenticated: authRes.authenticated,
    dealerId: authRes.dealerId,
    dealerName: authRes.dealerName,
    hasToken: !!authRes.token,
    error: authRes.error,
  });

  console.log('\n=== 3. CHECKING TODAY AUCTIONS ON TVS CERTIFIED ===');
  const token = authRes.token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token;

  try {
    const upcomingRes = await fetch('https://tvscertified.in:8036/getPostBidCounts?type=upcoming', { headers });
    const upcomingJson = await upcomingRes.json();
    console.log('Upcoming auctions endpoint response:', JSON.stringify(upcomingJson).slice(0, 500));
  } catch (err: any) {
    console.log('Upcoming auctions error:', err.message);
  }

  try {
    const liveRes = await fetch('https://tvscertified.in:8036/auctions?stage=live&auction_type=auction', { headers });
    const liveJson = await liveRes.json();
    console.log('Live auctions endpoint response:', JSON.stringify(liveJson).slice(0, 500));
  } catch (err: any) {
    console.log('Live auctions error:', err.message);
  }

  try {
    const allAucRes = await fetch('https://tvscertified.in:8036/auctions?auction_type=auction', { headers });
    const allAucJson = await allAucRes.json();
    console.log('All auctions endpoint response:', JSON.stringify(allAucJson).slice(0, 500));
  } catch (err: any) {
    console.log('All auctions error:', err.message);
  }

  console.log('\n=== 4. CHECKING SPECIFIC AUCTION 1978 DATA ===');
  try {
    const vehRes = await fetch('https://tvscertified.in:8036/getAuctionvehicleList?auction_id=1978', { headers });
    const vehJson = await vehRes.json();
    console.log('Auction 1978 vehicle list count:', vehJson?.data?.length || 'None', JSON.stringify(vehJson).slice(0, 300));
  } catch (err: any) {
    console.log('Auction 1978 vehicle list error:', err.message);
  }

  try {
    const regRes = await fetch('https://tvscertified.in:8036/auctionbidderregistration?auction_id=1978', { headers });
    const regJson = await regRes.json();
    console.log('Auction 1978 bidder registrations count:', regJson?.data?.length || 'None', JSON.stringify(regJson).slice(0, 300));
  } catch (err: any) {
    console.log('Auction 1978 bidder registration error:', err.message);
  }

  console.log('\n=== 5. DRY-RUNNING syncLiveAuction(\'1978\') ===');
  const syncRes = await syncLiveAuction('1978', token);
  console.log('Sync result:', syncRes);

  console.log('\nDone.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
