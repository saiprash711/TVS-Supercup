export type Language = 'en' | 'ta';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    ta: string;
  };
}

export const dealerTranslations: TranslationDictionary = {
  // ── Navbar ──
  'navbar.brand': {
    en: 'TVS SUPERCUP',
    ta: 'டிவிஎஸ் சூப்பர்கப்',
  },
  'navbar.testMode': {
    en: 'TEST MODE',
    ta: 'சோதனை முறை',
  },
  'navbar.leaderboard': {
    en: 'Leaderboard',
    ta: 'முன்னிலை பட்டியல்',
  },
  'navbar.myDashboard': {
    en: 'My Dashboard',
    ta: 'எனது டாஷ்போர்டு',
  },
  'navbar.pointRules': {
    en: 'Point Rules',
    ta: 'புள்ளி விதிகள்',
  },
  'navbar.termsRules': {
    en: 'Terms & Rules',
    ta: 'விதிமுறைகள்',
  },
  'navbar.logout': {
    en: 'Logout',
    ta: 'வெளியேறு',
  },
  'navbar.connectingGateway': {
    en: 'CONNECTING TO TVS TELEMETRY GATEWAY...',
    ta: 'டிவிஎஸ் டெலிமெட்ரி நுழைவாயிலுடன் இணைக்கிறது...',
  },

  // ── Language Toggle Tooltips ──
  'lang.switchToTamil': {
    en: 'தமிழுக்கு மாறவும் (Switch to Tamil)',
    ta: 'தமிழுக்கு மாறவும்',
  },
  'lang.switchToEnglish': {
    en: 'Switch to English',
    ta: 'ஆங்கிலத்திற்கு மாறவும் (Switch to English)',
  },

  // ── Ticker Items ──
  'ticker.champStatus': {
    en: 'CHAMPIONSHIP STATUS',
    ta: 'சாம்பியன்ஷிப் நிலை',
  },
  'ticker.champActive': {
    en: 'SUPER CUP 2026–27 ACTIVE',
    ta: 'சூப்பர்கப் 2026–27 நேரலையில் உள்ளது',
  },
  'ticker.preLaunch': {
    en: 'PRE-LAUNCH TEST WINDOW',
    ta: 'சோதனை சாளரம்',
  },
  'ticker.preLaunchVal': {
    en: 'TEST AUCTIONS 1 OCT & 8 OCT • LIVE CUP STARTS 15 OCT',
    ta: 'சோதனை ஏலங்கள் 1 அக் & 8 அக் • நேரடி கப் 15 அக் தொடக்கம்',
  },
  'ticker.liveCup': {
    en: 'LIVE CUP',
    ta: 'நேரடி கப்',
  },
  'ticker.testModeBadge': {
    en: 'TEST MODE',
    ta: 'சோதனை முறை',
  },
  'ticker.nextAuction': {
    en: 'NEXT AUCTION WINDOW',
    ta: 'அடுத்த ஏல நேரம்',
  },
  'ticker.countdown': {
    en: 'COUNTDOWN',
    ta: 'கவுண்ட்டவுன்',
  },
  'ticker.seasonGrandPrize': {
    en: 'SEASON GRAND PRIZE POOL',
    ta: 'சீசன் கிராண்ட் பரிசுத் தொகை',
  },
  'ticker.grandPrizeVal': {
    en: '₹1,00,000 FOR ENTIRE SEASON (₹50K BUYERS + ₹50K SELLERS)',
    ta: 'முழு சீசனுக்கும் ₹1,00,000 (வாங்குபவர்களுக்கு ₹50K + விற்பனையாளர்களுக்கு ₹50K)',
  },
  'ticker.podium': {
    en: 'PODIUM',
    ta: 'போடியம்',
  },
  'ticker.sellingAlloc': {
    en: 'SELLING ALLOCATIONS',
    ta: 'விற்பனை புள்ளிகள்',
  },
  'ticker.sellingAllocVal': {
    en: 'VEHICLE LISTING = +5 PTS • COMMISSION SETTLEMENT = +5 PTS',
    ta: 'வாகனப் பட்டியல் = +5 புள்ளிகள் • கமிஷன் தீர்வு = +5 புள்ளிகள்',
  },
  'ticker.sellingBadge': {
    en: 'SELLING',
    ta: 'விற்பனை',
  },
  'ticker.buyingAlloc': {
    en: 'BUYING ALLOCATIONS',
    ta: 'வாங்குதல் புள்ளிகள்',
  },
  'ticker.buyingAllocVal': {
    en: 'MATCH ATTENDANCE = +1 PT • BIDS = +1 PT (PER-CAR BASIS) • BONUS = +20 PTS',
    ta: 'ஏல வருகை = +1 புள்ளி • ஏலங்கள் = +1 புள்ளி (ஒரு காருக்கு) • போனஸ் = +20 புள்ளிகள்',
  },
  'ticker.buyingBadge': {
    en: 'BUYING',
    ta: 'வாங்குதல்',
  },
  'ticker.tvsNetwork': {
    en: 'TVS CERTIFIED NETWORK',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட நெட்வொர்க்',
  },
  'ticker.tvsNetworkVal': {
    en: 'TRANSPARENT DIGITAL AUCTIONS • AUDITED COMPLIANCE',
    ta: 'வெளிப்படையான டிஜிட்டல் ஏலங்கள் • தணிக்கை செய்யப்பட்ட இணக்கம்',
  },
  'ticker.verifiedBadge': {
    en: 'VERIFIED',
    ta: 'சரிபார்க்கப்பட்டது',
  },

  // ── Pre-launch Test Mode Banner ──
  'testBanner.title': {
    en: 'PRE-LAUNCH TEST MODE',
    ta: 'வெளியீட்டுக்கு முந்தைய சோதனை முறை',
  },
  'testBanner.desc': {
    en: 'Testing auctions: 1 Oct and 8 Oct. Test scores are isolated and will not carry into the live Super Cup.',
    ta: 'சோதனை ஏலங்கள்: 1 அக் மற்றும் 8 அக். சோதனை மதிப்பெண்கள் தனித்தனியாக இருக்கும் மற்றும் நேரடி சூப்பர்கப்பில் சேர்க்கப்படாது.',
  },
  'testBanner.badge': {
    en: 'LIVE CAMPAIGN STARTS 15 OCT',
    ta: 'நேரடி பிரச்சாரம் 15 அக் தொடங்குகிறது',
  },

  // ── Hero Cockpit ──
  'hero.campaignActive': {
    en: 'LIVE CHAMPIONSHIP ACTIVE',
    ta: 'நேரலை சாம்பியன்ஷிப் இயங்குகிறது',
  },
  'hero.testModeNotice': {
    en: 'PRE-LAUNCH TEST MODE • 1 & 8 OCT',
    ta: 'வெளியீட்டுக்கு முந்தைய சோதனை முறை • 1 & 8 அக்',
  },
  'hero.greeting': {
    en: 'WELCOME, {dealerName}',
    ta: 'வரவேற்கிறோம், {dealerName}',
  },
  'hero.leadTitle': {
    en: 'DEALER SUPERCUP',
    ta: 'டீலர் சூப்பர்கப்',
  },
  'hero.leadTitleAccent': {
    en: '2026–27',
    ta: '2026–27',
  },
  'hero.liveLeaderboard': {
    en: 'Live Leaderboard',
    ta: 'நேரலை முன்னிலை பட்டியல்',
  },
  'hero.rulesScoring': {
    en: 'Rules & Scoring',
    ta: 'விதிகள் & மதிப்பெண்',
  },
  'hero.nextMatch': {
    en: 'Next Auction Match:',
    ta: 'அடுத்த ஏலப் போட்டி:',
  },
  'hero.everyThursday': {
    en: 'Every Thursday 2:00 PM',
    ta: 'ஒவ்வொரு வியாழக்கிழமையும் மதியம் 2:00 மணி',
  },
  'hero.statPoints': {
    en: 'Total Points',
    ta: 'மொத்த புள்ளிகள்',
  },
  'hero.statPointsSub': {
    en: 'Buyer {buyer} • Seller {seller}',
    ta: 'வாங்குதல் {buyer} • விற்பனை {seller}',
  },
  'hero.statBuyerRank': {
    en: 'Buyer Rank',
    ta: 'வாங்குபவர் தரவரிசை',
  },
  'hero.statBuyerRankSub': {
    en: '{points} Buyer Pts',
    ta: '{points} வாங்குபவர் புள்ளிகள்',
  },
  'hero.statSellerRank': {
    en: 'Seller Rank',
    ta: 'விற்பனையாளர் தரவரிசை',
  },
  'hero.statSellerRankSub': {
    en: '{points} Seller Pts',
    ta: '{points} விற்பனையாளர் புள்ளிகள்',
  },
  'hero.statPrizes': {
    en: 'Prize Purse',
    ta: 'பரிசுத் தொகை',
  },
  'hero.statPrizesSub': {
    en: 'Dual League Pool',
    ta: 'இரட்டை லீக் பரிசு குளம்',
  },

  // ── Prize Showcase ──
  'prize.seasonPool': {
    en: 'SEASON GRAND PRIZE POOL',
    ta: 'சீசன் கிராண்ட் பரிசுத் தொகை',
  },
  'prize.seasonTotal': {
    en: '₹1,00,000 Total Cash Awards',
    ta: 'மொத்தம் ₹1,00,000 ரொக்கப் பரிசுகள்',
  },
  'prize.dualLeagueSplit': {
    en: '₹50,000 for Buyer League Podium + ₹50,000 for Seller League Podium awarded at end of campaign.',
    ta: 'சீசனின் முடிவில் வாங்குபவர் லீக் போடியத்திற்கு ₹50,000 + விற்பனையாளர் லீக் போடியத்திற்கு ₹50,000 வழங்கப்படுகிறது.',
  },
  'prize.buyerPodium': {
    en: 'Buyer League Podium (₹50,000)',
    ta: 'வாங்குபவர் லீக் போடியம் (₹50,000)',
  },
  'prize.sellerPodium': {
    en: 'Seller League Podium (₹50,000)',
    ta: 'விற்பனையாளர் லீக் போடியம் (₹50,000)',
  },
  'prize.champion': {
    en: '1ST PLACE • CHAMPION',
    ta: '1வது இடம் • சாம்பியன்',
  },
  'prize.champVal': {
    en: '₹25,000',
    ta: '₹25,000',
  },
  'prize.runnerUp': {
    en: '2ND PLACE • RUNNER-UP',
    ta: '2வது இடம் • ரன்னர்-அப்',
  },
  'prize.runnerVal': {
    en: '₹15,000',
    ta: '₹15,000',
  },
  'prize.secondRunner': {
    en: '3RD PLACE • 2ND RUNNER-UP',
    ta: '3வது இடம் • 2வது ரன்னர்-அப்',
  },
  'prize.secondRunnerVal': {
    en: '₹10,000',
    ta: '₹10,000',
  },
  'prize.tieBreakerNote': {
    en: 'Tie-Breaker Rule: If dealers tie on points at season end, combined prize money for tied positions is split equally.',
    ta: 'சமநிலை விதி: சீசன் முடிவில் டீலர்கள் ஒரே புள்ளிகளைப் பெற்றால், அந்த இடங்களுக்கான மொத்த பரிசுத் தொகை சமமாகப் பிரிக்கப்படும்.',
  },

  // ── Dual League Standings ──
  'leagues.title': {
    en: 'Dual League Standings & Your Position',
    ta: 'இரட்டை லீக் நிலவரம் & உங்கள் நிலை',
  },
  'leagues.desc': {
    en: 'Separate Buyer and Seller streams. Rank high in either league to win podium cash prizes.',
    ta: 'தனித்தனி வாங்குபவர் மற்றும் விற்பனையாளர் பிரிவுகள். போடியம் ரொக்கப் பரிசுகளை வெல்ல ஏதேனும் ஒரு லீகில் உயர் தரவரிசையைப் பெறுங்கள்.',
  },
  'leagues.buyerCardTitle': {
    en: 'Buyer League Standing',
    ta: 'வாங்குபவர் லீக் நிலை',
  },
  'leagues.buyerCardDesc': {
    en: 'Bids on unique cars (+1 pt/car), match attendance (+1 pt/match), and attendance bonus (+20 pts).',
    ta: 'தனிப்பட்ட கார்கள் மீதான ஏலங்கள் (+1 புள்ளி/கார்), வருகை (+1 புள்ளி/போட்டி), மற்றும் போனஸ் (+20 புள்ளிகள்).',
  },
  'leagues.sellerCardTitle': {
    en: 'Seller League Standing',
    ta: 'விற்பனையாளர் லீக் நிலை',
  },
  'leagues.sellerCardDesc': {
    en: 'Vehicle listings (+5 pts/car) and commission settlements (+5 pts/settled lot).',
    ta: 'வாகனப் பட்டியல்கள் (+5 புள்ளிகள்/கார்) மற்றும் கமிஷன் தீர்வுகள் (+5 புள்ளிகள்/வாகனம்).',
  },
  'leagues.rankLabel': {
    en: 'Rank #{rank} of {total}',
    ta: '{total} இல் தரவரிசை #{rank}',
  },
  'leagues.pointsVal': {
    en: '{points} Points',
    ta: '{points} புள்ளிகள்',
  },
  'leagues.topPodium': {
    en: 'TOP PODIUM SPOT',
    ta: 'முதல் போடியம் இடம்',
  },
  'leagues.ptsFromPodium': {
    en: '{pts} pts from podium',
    ta: 'போடியத்திலிருந்து {pts} புள்ளிகள்',
  },
  'leagues.viewLeaderboardBtn': {
    en: 'View Leaderboard',
    ta: 'முன்னிலை பட்டியல்',
  },

  // ── Activity Breakdown ──
  'activity.title': {
    en: 'Your Verified Points Activity',
    ta: 'உங்கள் சரிபார்க்கப்பட்ட புள்ளி விவரங்கள்',
  },
  'activity.desc': {
    en: 'Itemized breakdown of how your TVS Super Cup points were calculated',
    ta: 'உங்கள் டிவிஎஸ் சூப்பர்கப் புள்ளிகள் எவ்வாறு கணக்கிடப்பட்டன என்பதன் விவரம்',
  },
  'activity.bidsTitle': {
    en: 'Unique Car Bids Placed',
    ta: 'ஏலம் கேட்கப்பட்ட தனிப்பட்ட கார்கள்',
  },
  'activity.bidsDesc': {
    en: '1 point per unique vehicle lot bid (+1 pt per car basis)',
    ta: 'தனிப்பட்ட வாகனத்திற்கு 1 புள்ளி (காருக்கு +1 புள்ளி)',
  },
  'activity.attendanceTitle': {
    en: 'Thursday 2PM Matches Attended',
    ta: 'பங்கேற்ற வியாழன் மதியம் 2 மணி போட்டிகள்',
  },
  'activity.attendanceDesc': {
    en: '1 point per Thursday live auction attended',
    ta: 'பங்கேற்ற வியாழக்கிழமை நேரடி ஏலத்திற்கு 1 புள்ளி',
  },
  'activity.bonusTitle': {
    en: 'All-Matches Attendance Bonus',
    ta: 'அனைத்து போட்டிகள் வருகை போனஸ்',
  },
  'activity.bonusDesc': {
    en: 'Bonus awarded for attending every Thursday match (Season finale)',
    ta: 'ஒவ்வொரு வியாழன் போட்டியிலும் கலந்துகொள்வதற்கான போனஸ் (சீசன் முடிவு)',
  },
  'activity.listingsTitle': {
    en: 'Vehicle Listings Consigned',
    ta: 'பட்டியலிடப்பட்ட வாகனங்கள்',
  },
  'activity.listingsDesc': {
    en: '5 points per vehicle listed in TVS Certified auction',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட ஏலத்தில் பட்டியலிடப்பட்ட வாகனத்திற்கு 5 புள்ளிகள்',
  },
  'activity.settlementsTitle': {
    en: 'Commission Settlements',
    ta: 'கமிஷன் தீர்வுகள்',
  },
  'activity.settlementsDesc': {
    en: '5 points per successful sale settlement completed',
    ta: 'முடிக்கப்பட்ட வெற்றிகரமான விற்பனைத் தீர்வுக்கு 5 புள்ளிகள்',
  },
  'activity.pointsBadge': {
    en: '+{pts} PTS',
    ta: '+{pts} புள்ளிகள்',
  },

  // ── Radar ──
  'radar.title': {
    en: 'Leaderboard Neighbor Radar',
    ta: 'முன்னிலை அருகாமை ரேடார்',
  },
  'radar.desc': {
    en: 'See dealerships immediately above and below you in current standings',
    ta: 'தற்போதைய தரவரிசையில் உங்களுக்கு முன்னும் பின்னும் உள்ள டீலர்ஷிப்களைக் காண்க',
  },
  'radar.youBadge': {
    en: 'YOU',
    ta: 'நீங்கள்',
  },

  // ── Match Day Tracker ──
  'tracker.title': {
    en: 'Match Day Attendance Tracker (Thursday 2:00 PM)',
    ta: 'போட்டி நாள் வருகை கண்காணிப்பு (வியாழன் மதியம் 2:00 மணி)',
  },
  'tracker.desc': {
    en: 'Attend every Thursday live auction at 2:00 PM to earn +1 pt per match and qualify for the +20 PTS All-Matches Bonus!',
    ta: 'ஒரு போட்டிக்கு +1 புள்ளியைப் பெறவும், +20 புள்ளி அனைத்து போட்டிகள் போனஸைப் பெறவும் ஒவ்வொரு வியாழக்கிழமையும் மதியம் 2:00 மணிக்கு நேரடி ஏலத்தில் பங்கேற்கவும்!',
  },
  'tracker.attended': {
    en: 'Attended',
    ta: 'பங்கேற்றது',
  },
  'tracker.missed': {
    en: 'Missed',
    ta: 'தவறியது',
  },
  'tracker.upcoming': {
    en: 'Upcoming',
    ta: 'வரவிருக்கும்',
  },

  // ── Live Auction Telemetry ──
  'telemetry.title': {
    en: 'Live Auction Telemetry & Feed',
    ta: 'நேரடி ஏல டெலிமெட்ரி & தகவல் ஊட்டம்',
  },
  'telemetry.desc': {
    en: 'Real-time telemetry from TVS Certified auction sessions',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட ஏல அமர்வுகளிலிருந்து நேரடி தகவல்கள்',
  },
  'telemetry.won': {
    en: 'LOT WON (CONVERTED)',
    ta: 'வென்ற லாட் (விற்பனை)',
  },
  'telemetry.listed': {
    en: 'VEHICLE LISTED',
    ta: 'வாகனம் பட்டியலிடப்பட்டது',
  },
  'telemetry.commissionSettled': {
    en: 'COMMISSION SETTLED',
    ta: 'கமிஷன் தீர்க்கப்பட்டது',
  },
  'telemetry.bidPlaced': {
    en: 'BID PLACED',
    ta: 'ஏலம் கேட்கப்பட்டது',
  },
  'telemetry.room2pm': {
    en: '2PM ROOM',
    ta: 'மதியம் 2 மணி அறை',
  },
  'telemetry.emptyTitle': {
    en: 'No Live Auction Events Recorded In Current Window',
    ta: 'தற்போதைய நேரத்தில் நேரடி ஏல நிகழ்வுகள் எதுவும் பதிவு செய்யப்படவில்லை',
  },
  'telemetry.emptyCallout': {
    en: 'Place bids, win lots, or attend the 2:00 PM digital room to earn verified points instantly!',
    ta: 'உடனடியாக சரிபார்க்கப்பட்ட புள்ளிகளைப் பெற ஏலம் கேளுங்கள், வாகனங்களை வெல்லுங்கள் அல்லது மதியம் 2:00 மணி டிஜிட்டல் அறையில் பங்கேற்கவும்!',
  },

  // ── Scoring Protocol Cards ──
  'protocol.title': {
    en: 'Scoring Protocol & Point Allocations',
    ta: 'மதிப்பெண் நெறிமுறை & புள்ளி ஒதுக்கீடுகள்',
  },
  'protocol.subtitle': {
    en: 'Verified point earning structure for the TVS Super Cup',
    ta: 'டிவிஎஸ் சூப்பர்கப்பிற்கான சரிபார்க்கப்பட்ட புள்ளி ஈட்டும் கட்டமைப்பு',
  },
  'protocol.fullHandbook': {
    en: 'Full Rules Handbook',
    ta: 'முழு விதிகள் கையேடு',
  },
  'protocol.listing': {
    en: 'Vehicle Listing (SELL)',
    ta: 'வாகனப் பட்டியல் (விற்பனை)',
  },
  'protocol.commission': {
    en: 'Commission Settlement (SELL)',
    ta: 'கமிஷன் தீர்வு (விற்பனை)',
  },
  'protocol.bid': {
    en: 'Unique Car Bid (BUY - Per Car)',
    ta: 'தனிப்பட்ட கார் ஏலம் (வாங்குதல் - காருக்கு)',
  },
  'protocol.attendance': {
    en: 'Match Room Attendance (BUY)',
    ta: 'போட்டி அறை வருகை (வாங்குதல்)',
  },
  'protocol.bonus': {
    en: 'All-Matches Bonus (BUY)',
    ta: 'அனைத்து போட்டிகள் போனஸ் (வாங்குதல்)',
  },
  'protocol.seasonPrize': {
    en: 'Season Prize (₹50k Buy / ₹50k Sell)',
    ta: 'சீசன் பரிசு (₹50k வாங்குபவர் / ₹50k விற்பனையாளர்)',
  },

  // ── Footer ──
  'footer.network': {
    en: 'TVS Certified Network',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட நெட்வொர்க்',
  },
  'footer.cup': {
    en: 'Dealer Super Cup 2026',
    ta: 'டீலர் சூப்பர்கப் 2026',
  },
  'footer.motto': {
    en: 'People • Platform • Progress',
    ta: 'மனிதர்கள் • தளம் • முன்னேற்றம்',
  },
  'footer.disclaimer': {
    en: 'Official TVS Certified Dealership Portal. All points and ranks are subject to automated verification.',
    ta: 'அதிகாரப்பூர்வ டிவிஎஸ் சான்றளிக்கப்பட்ட டீலர்ஷிப் தளம். அனைத்து புள்ளிகளும் தரவரிசைகளும் தானியங்கி சரிபார்ப்புக்கு உட்பட்டவை.',
  },
  'footer.viewLeaderboard': {
    en: 'View Public Leaderboard →',
    ta: 'பொது முன்னிலை அட்டவணையைப் பார்க்கவும் →',
  },
  'footer.termsModal': {
    en: 'Official Terms & Conditions (Buyer & Seller Leagues)',
    ta: 'அதிகாரப்பூர்வ விதிமுறைகள் & நிபந்தனைகள் (வாங்குபவர் & விற்பனையாளர் லீகுகள்)',
  },
  'footer.standaloneTerms': {
    en: 'Standalone Terms Page',
    ta: 'விதிமுறைகள் பக்கம்',
  },

  // ── Rules Modal ──
  'modal.rulesHandbook': {
    en: 'OFFICIAL SUPERCUP 2026–27 HANDBOOK',
    ta: 'அதிகாரப்பூர்வ சூப்பர்கப் 2026–27 கையேடு',
  },
  'modal.howPointsCalculated': {
    en: 'How Points are Calculated',
    ta: 'புள்ளிகள் எவ்வாறு கணக்கிடப்படுகின்றன',
  },
  'modal.welcomeDealer': {
    en: 'Welcome {dealerName}! Points are tracked automatically in real-time from TVS Certified live platform telemetry. Here is exactly how you earn verified points and climb the championship leaderboard.',
    ta: 'வரவேற்கிறோம் {dealerName}! டிவிஎஸ் சான்றளிக்கப்பட்ட தளத்திலிருந்து புள்ளிகள் நிகழ்நேரத்தில் தானாகக் கண்காணிக்கப்படுகின்றன. நீங்கள் எவ்வாறு புள்ளிகளைப் பெற்று முன்னிலை பெறலாம் என்பது இங்கே விளக்கப்பட்டுள்ளது.',
  },
  'modal.tabAll': {
    en: 'All Point Rules',
    ta: 'அனைத்து புள்ளி விதிகள்',
  },
  'modal.tabSelling': {
    en: 'Selling Allocations (+5 PTS)',
    ta: 'விற்பனை புள்ளிகள் (+5 புள்ளிகள்)',
  },
  'modal.tabBuying': {
    en: 'Buying Allocations (+1 PT)',
    ta: 'வாங்குதல் புள்ளிகள் (+1 புள்ளி)',
  },
  'modal.sellerStream': {
    en: 'SELLER STREAM',
    ta: 'விற்பனையாளர் பிரிவு',
  },
  'modal.buyerStream': {
    en: 'BUYER STREAM',
    ta: 'வாங்குபவர் பிரிவு',
  },
  'modal.understoodBtn': {
    en: 'Understood, Let\'s Compete!',
    ta: 'புரிந்தது, போட்டியைத் தொடங்குவோம்!',
  },
  'modal.dontShowAgain': {
    en: 'Don\'t show this popup automatically on login',
    ta: 'உள்நுழையும்போது இந்த அறிவிப்பைத் தானாகக் காட்ட வேண்டாம்',
  },
  'modal.tieBreakerTitle': {
    en: 'Equal Points Prize Distribution (Tie-Breaker Rule)',
    ta: 'சம புள்ளிகள் பரிசு விநியோகம் (சமநிலை விதி)',
  },
  'modal.tieBreakerDesc': {
    en: 'If two or more buyers or sellers score the exact same points on the podium, the combined prize purse for those positions is split equally (e.g. 2-way tie for 1st splits ₹40,000 = ₹20,000 each).',
    ta: 'இரண்டு அல்லது அதற்கு மேற்பட்ட வாங்குபவர்கள் அல்லது விற்பனையாளர்கள் போடியத்தில் ஒரே புள்ளிகளைப் பெற்றால், அந்த இடங்களுக்கான மொத்த பரிசு சமமாகப் பிரிக்கப்படும் (எ.கா. 1வது இடத்திற்கு சமநிலை ஏற்பட்டால் ₹40,000 தலா ₹20,000 ஆகப் பிரிக்கப்படும்).',
  },

  // ── Terms Modal ──
  'termsModal.eyebrow': {
    en: 'OFFICIAL TOURNAMENT REGULATIONS',
    ta: 'அதிகாரப்பூர்வ போட்டி விதிமுறைகள்',
  },
  'termsModal.title': {
    en: 'Terms & Conditions',
    ta: 'விதிமுறைகள் & நிபந்தனைகள்',
  },
  'termsModal.subtitle': {
    en: 'Official rules, scoring policies, and prize distribution guidelines for the TVS Certified Dealer Super Cup 2026–27. All participating dealerships are governed by these regulations.',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட டீலர் சூப்பர்கப் 2026–27 க்கான அதிகாரப்பூர்வ விதிகள், மதிப்பெண் கொள்கைகள் மற்றும் பரிசு விநியோக வழிகாட்டுதல்கள். பங்கேற்கும் அனைத்து டீலர்ஷிப்களும் இந்த விதிமுறைகளுக்கு உட்பட்டவை.',
  },
  'termsModal.tabAll': {
    en: 'Overview & Eligibility',
    ta: 'பொது கண்ணோட்டம் & தகுதி',
  },
  'termsModal.tabBuyers': {
    en: 'Buyer League Rules',
    ta: 'வாங்குபவர் லீக் விதிகள்',
  },
  'termsModal.tabSellers': {
    en: 'Seller League Rules',
    ta: 'விற்பனையாளர் லீக் விதிகள்',
  },
  'termsModal.tabPrizes': {
    en: 'Prize Split & Ties',
    ta: 'பரிசுப் பகிர்வு & சமநிலை',
  },

  // ── Leaderboard Page Translations ──
  'leaderboard.brand': {
    en: 'TVS Super Cup',
    ta: 'டிவிஎஸ் சூப்பர்கப்',
  },
  'leaderboard.testMode': {
    en: 'TEST MODE',
    ta: 'சோதனை முறை',
  },
  'leaderboard.live': {
    en: 'LIVE',
    ta: 'நேரலை',
  },
  'leaderboard.navStandings': {
    en: 'Leaderboard',
    ta: 'முன்னிலை பட்டியல்',
  },
  'leaderboard.navDashboard': {
    en: 'My Dashboard',
    ta: 'எனது டாஷ்போர்டு',
  },
  'leaderboard.navTerms': {
    en: 'Terms & Rules',
    ta: 'விதிமுறைகள் & விதிகள்',
  },
  'leaderboard.signIn': {
    en: 'Sign In',
    ta: 'உள்நுழைக',
  },
  'leaderboard.adminViewTitle': {
    en: 'Admin Mission Control View',
    ta: 'நிர்வாக கட்டுப்பாட்டு பார்வை',
  },
  'leaderboard.adminMaskedBadge': {
    en: '🔒 MASKED PREVIEW',
    ta: '🔒 மறைக்கப்பட்ட முன்னோட்டம்',
  },
  'leaderboard.adminUnmaskedBadge': {
    en: '👁️ UNMASKED (FULL VISIBILITY)',
    ta: '👁️ முழு விவரப் பார்வை',
  },
  'leaderboard.adminMaskedSub': {
    en: 'Viewing leaderboard as participating dealers see it (competitor names masked).',
    ta: 'பங்கேற்கும் டீலர்கள் பார்ப்பது போல் காட்டப்படுகிறது (போட்டியாளர் பெயர்கள் மறைக்கப்பட்டுள்ளன).',
  },
  'leaderboard.adminUnmaskedSub': {
    en: 'Full legal dealership names, TVS Customer IDs, and performance telemetry are visible to Admin.',
    ta: 'முழு டீலர்ஷிப் பெயர்கள், டிவிஎஸ் வாடிக்கையாளர் ஐடிகள் மற்றும் செயல்திறன் தரவுகள் நிர்வாகிக்குத் தெரியும்.',
  },
  'leaderboard.switchUnmasked': {
    en: 'Switch to Unmasked View',
    ta: 'முழு விவரப் பார்வைக்கு மாறவும்',
  },
  'leaderboard.previewMasked': {
    en: 'Preview Dealer Masked View',
    ta: 'டீலர் பார்வைக்கு மாறவும்',
  },
  'leaderboard.missionControlBtn': {
    en: 'Mission Control',
    ta: 'நிர்வாக மையம்',
  },
  'leaderboard.heroVerified': {
    en: 'TVS Certified Network',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட நெட்வொர்க்',
  },
  'leaderboard.heroPrizePool': {
    en: 'Two Leaderboards • ₹1,00,000 Cash Pool',
    ta: 'இரண்டு முன்னிலை அட்டவணைகள் • ₹1,00,000 ரொக்கப் பரிசு',
  },
  'leaderboard.heroTitle': {
    en: 'DEALER',
    ta: 'டீலர்',
  },
  'leaderboard.heroTitleAccent': {
    en: 'SUPER CUP',
    ta: 'சூப்பர்கப்',
  },
  'leaderboard.heroSubtitle': {
    en: 'Official national leaderboard for verified TVS dealerships across India. Compete in weekly high-velocity auctions and climb separate Buyer and Seller standings.',
    ta: 'இந்தியா முழுவதும் உள்ள சான்றளிக்கப்பட்ட டிவிஎஸ் டீலர்ஷிப்களுக்கான அதிகாரப்பூர்வ தேசிய முன்னிலை அட்டவணை. வாராந்திர அதிவேக ஏலங்களில் போட்டியிட்டு, தனித்தனி வாங்குபவர் மற்றும் விற்பனையாளர் தரவரிசையில் முன்னேறுங்கள்.',
  },
  'leaderboard.telemetrySeason': {
    en: 'Season:',
    ta: 'சீசன்:',
  },
  'leaderboard.telemetryBuyers': {
    en: 'Buyers:',
    ta: 'வாங்குபவர்கள்:',
  },
  'leaderboard.telemetrySellers': {
    en: 'Sellers:',
    ta: 'விற்பனையாளர்கள்:',
  },
  'leaderboard.telemetryTotal': {
    en: 'Total:',
    ta: 'மொத்தம்:',
  },
  'leaderboard.telemetryActive': {
    en: 'Active',
    ta: 'செயலில்',
  },
  'leaderboard.telemetryPodium': {
    en: 'Podium:',
    ta: 'போடியம்:',
  },
  'leaderboard.telemetryPoolVal': {
    en: '₹50,000 League Pool',
    ta: '₹50,000 லீக் பரிசுத் தொகை',
  },
  'leaderboard.telemetryScoring': {
    en: 'Scoring:',
    ta: 'மதிப்பெண்:',
  },
  'leaderboard.telemetryScoringVal': {
    en: 'Verified TVS Telemetry',
    ta: 'சரிபார்க்கப்பட்ட டிவிஎஸ் டெலிமெட்ரி',
  },
  'leaderboard.tabBuyer': {
    en: 'Buyer Leaderboard',
    ta: 'வாங்குபவர் முன்னிலை அட்டவணை',
  },
  'leaderboard.tabSeller': {
    en: 'Seller Leaderboard',
    ta: 'விற்பனையாளர் முன்னிலை அட்டவணை',
  },
  'leaderboard.podiumHeaderBuyers': {
    en: 'Top 3 Buyers Podium • ₹50,000 Cash Pool',
    ta: 'முதல் 3 வாங்குபவர்கள் போடியம் • ₹50,000 ரொக்கப் பரிசு',
  },
  'leaderboard.podiumHeaderSellers': {
    en: 'Top 3 Sellers Podium • ₹50,000 Cash Pool',
    ta: 'முதல் 3 விற்பனையாளர்கள் போடியம் • ₹50,000 ரொக்கப் பரிசு',
  },
  'leaderboard.topBuyer1': {
    en: 'Top Buyer • #1',
    ta: 'முதல் வாங்குபவர் • #1',
  },
  'leaderboard.podiumBuyer2': {
    en: 'Podium 2nd Buyer • #2',
    ta: '2வது இடம் வாங்குபவர் • #2',
  },
  'leaderboard.podiumBuyer3': {
    en: 'Podium 3rd Buyer • #3',
    ta: '3வது இடம் வாங்குபவர் • #3',
  },
  'leaderboard.topSeller1': {
    en: 'Top Seller • #1',
    ta: 'முதல் விற்பனையாளர் • #1',
  },
  'leaderboard.podiumSeller2': {
    en: 'Podium 2nd Seller • #2',
    ta: '2வது இடம் விற்பனையாளர் • #2',
  },
  'leaderboard.podiumSeller3': {
    en: 'Podium 3rd Seller • #3',
    ta: '3வது இடம் விற்பனையாளர் • #3',
  },
  'leaderboard.you': {
    en: 'YOU',
    ta: 'நீங்கள்',
  },
  'leaderboard.buyerStatsTelemetry': {
    en: '{buys} Lots Won • {bids} Cars Bid',
    ta: '{buys} வென்ற லாட்டுகள் • {bids} ஏலம் கேட்ட கார்கள்',
  },
  'leaderboard.sellerStatsTelemetry': {
    en: '{sales} Lots Sold • {listings} Listed',
    ta: '{sales} விற்ற லாட்டுகள் • {listings} பட்டியலிடப்பட்டது',
  },
  'leaderboard.buyerPointsLabel': {
    en: 'Buyer Points',
    ta: 'வாங்குபவர் புள்ளிகள்',
  },
  'leaderboard.sellerPointsLabel': {
    en: 'Seller Points',
    ta: 'விற்பனையாளர் புள்ளிகள்',
  },
  'leaderboard.rankingsTitleBuyers': {
    en: 'Official Buyer Rankings',
    ta: 'அதிகாரப்பூர்வ வாங்குபவர் தரவரிசை',
  },
  'leaderboard.rankingsTitleSellers': {
    en: 'Official Seller Rankings',
    ta: 'அதிகாரப்பூர்வ விற்பனையாளர் தரவரிசை',
  },
  'leaderboard.liveSyncedAt': {
    en: 'Live synced at {time}',
    ta: '{time} மணிக்கு நேரலையில் ஒத்திசைக்கப்பட்டது',
  },
  'leaderboard.liveSyncingActive': {
    en: 'Live syncing active',
    ta: 'நேரடி ஒத்திசைவு செயல்பாட்டில் உள்ளது',
  },
  'leaderboard.refreshNotice': {
    en: '• Automated 30-second refresh • Verified Standings',
    ta: '• தானியங்கி 30-வினாடி புதுப்பித்தல் • சரிபார்க்கப்பட்ட தரவரிசை',
  },
  'leaderboard.refreshBtn': {
    en: 'Refresh Standings',
    ta: 'தரவரிசையைப் புதுப்பிக்கவும்',
  },
  'leaderboard.searchPlaceholder': {
    en: 'Search dealership name or rank #...',
    ta: 'டீலர்ஷிப் பெயர் அல்லது தரவரிசை எண் தேடுக...',
  },
  'leaderboard.rowsPerPage': {
    en: 'Rows per page:',
    ta: 'பக்கத்திற்கு வரிசைகள்:',
  },
  'leaderboard.rows5': {
    en: '5 rows (Top 5)',
    ta: '5 வரிசைகள் (முதல் 5)',
  },
  'leaderboard.rows10': {
    en: '10 rows',
    ta: '10 வரிசைகள்',
  },
  'leaderboard.rows25': {
    en: '25 rows',
    ta: '25 வரிசைகள்',
  },
  'leaderboard.rows50': {
    en: '50 rows',
    ta: '50 வரிசைகள்',
  },
  'leaderboard.rows100': {
    en: '100 rows',
    ta: '100 வரிசைகள்',
  },
  'leaderboard.rowsAll': {
    en: 'All Dealerships',
    ta: 'அனைத்து டீலர்ஷிப்களும்',
  },
  'leaderboard.foundMatching': {
    en: 'Found {count} matching dealerships',
    ta: '{count} பொருத்தமான டீலர்ஷிப்கள் கண்டறியப்பட்டன',
  },
  'leaderboard.showingRange': {
    en: 'Showing {start}–{end} of {total} dealerships',
    ta: '{total} டீலர்ஷிப்களில் {start}–{end} காட்டப்படுகிறது',
  },
  'leaderboard.thRank': {
    en: 'Rank',
    ta: 'தரவரிசை',
  },
  'leaderboard.thCustomerId': {
    en: 'Customer ID',
    ta: 'வாடிக்கையாளர் ஐடி',
  },
  'leaderboard.thDealership': {
    en: 'Dealership Name',
    ta: 'டீலர்ஷிப் பெயர்',
  },
  'leaderboard.thCity': {
    en: 'City',
    ta: 'நகரம்',
  },
  'leaderboard.thBuyerStats': {
    en: 'Buyer Stats',
    ta: 'வாங்குபவர் புள்ளிவிவரம்',
  },
  'leaderboard.thSellerStats': {
    en: 'Seller Stats',
    ta: 'விற்பனையாளர் புள்ளிவிவரம்',
  },
  'leaderboard.thBuyerPoints': {
    en: 'Buyer Points',
    ta: 'வாங்குபவர் புள்ளிகள்',
  },
  'leaderboard.thSellerPoints': {
    en: 'Seller Points',
    ta: 'விற்பனையாளர் புள்ளிகள்',
  },
  'leaderboard.badgeChampion': {
    en: 'CHAMPION',
    ta: 'சாம்பியன்',
  },
  'leaderboard.badge2nd': {
    en: '2ND PODIUM',
    ta: '2வது இடம்',
  },
  'leaderboard.badge3rd': {
    en: '3RD PODIUM',
    ta: '3வது இடம்',
  },
  'leaderboard.wonSuffix': {
    en: 'Won',
    ta: 'வென்றது',
  },
  'leaderboard.carsBidSuffix': {
    en: 'Cars Bid',
    ta: 'கார்கள் ஏலம்',
  },
  'leaderboard.soldSuffix': {
    en: 'Sold',
    ta: 'விற்கப்பட்டது',
  },
  'leaderboard.listedSuffix': {
    en: 'Listed',
    ta: 'பட்டியலிடப்பட்டது',
  },
  'leaderboard.buyerPtsSub': {
    en: 'Buyer Pts',
    ta: 'வாங்குபவர் புள்ளிகள்',
  },
  'leaderboard.sellerPtsSub': {
    en: 'Seller Pts',
    ta: 'விற்பனையாளர் புள்ளிகள்',
  },
  'leaderboard.myPositionEyebrow': {
    en: 'MY CHAMPIONSHIP STANDING',
    ta: 'எனது சாம்பியன்ஷிப் நிலை',
  },
  'leaderboard.verifiedPosition': {
    en: 'VERIFIED POSITION',
    ta: 'சரிபார்க்கப்பட்ட நிலை',
  },
  'leaderboard.metricCurrentRank': {
    en: 'CURRENT RANK',
    ta: 'தற்போதைய தரவரிசை',
  },
  'leaderboard.metricBuyerPoints': {
    en: 'BUYER POINTS',
    ta: 'வாங்குபவர் புள்ளிகள்',
  },
  'leaderboard.metricSellerPoints': {
    en: 'SELLER POINTS',
    ta: 'விற்பனையாளர் புள்ளிகள்',
  },
  'leaderboard.metricTo1stPlace': {
    en: 'TO SECURE 1ST PLACE',
    ta: '1வது இடத்தைப் பிடிக்க',
  },
  'leaderboard.bidMoreBadge': {
    en: 'Bid more to win!',
    ta: 'வெற்றி பெற கூடுதல் ஏலம் கேளுங்கள்!',
  },
  'leaderboard.leadSecured': {
    en: 'Lead Secured',
    ta: 'முன்னிலை பாதுகாக்கப்பட்டது',
  },
  'leaderboard.bidMoreToWinMsg': {
    en: 'Bid more to win! You need {points} more points to secure 1st place (Leader has {top1} pts). Compete in upcoming live auctions to climb the standings!',
    ta: 'வெற்றி பெற கூடுதல் ஏலம் கேளுங்கள்! 1வது இடத்தைப் பிடிக்க உங்களுக்கு இன்னும் {points} புள்ளிகள் தேவை (சாம்பியன்: {top1} புள்ளிகள்). முன்னிலைக்கு வர நேரடி ஏலங்களில் பங்கேற்கவும்!',
  },
  'leaderboard.championMsg': {
    en: 'You are currently in 1st place! Keep bidding to defend your championship crown!',
    ta: 'நீங்கள் தற்போது 1வது இடத்தில் உள்ளீர்கள்! உங்கள் சாம்பியன் பட்டத்தைத் தக்கவைத்துக் கொள்ள தொடர்ந்து ஏலம் கேளுங்கள்!',
  },
  'leaderboard.championLeadingMsgShort': {
    en: 'Rank #1 • Defend your championship lead!',
    ta: 'தரவரிசை #1 • உங்கள் சாம்பியன் முன்னிலையைத் தக்கவைக்கவும்!',
  },
  'leaderboard.bidMoreCalloutInline': {
    en: 'Need {points} pts to secure 1st place • Bid more to win!',
    ta: '1வது இடத்தைப் பிடிக்க {points} புள்ளிகள் தேவை • வெற்றி பெற கூடுதல் ஏலம் கேளுங்கள்!',
  },
  'leaderboard.yourStandingDivider': {
    en: 'YOUR CURRENT POSITION',
    ta: 'உங்கள் தற்போதைய இடம்',
  },
  'leaderboard.yourPosition': {
    en: 'Your Position',
    ta: 'உங்கள் இடம்',
  },
  'leaderboard.noMatchingTitle': {
    en: 'No matching dealerships found',
    ta: 'பொருத்தமான டீலர்ஷிப்கள் எதுவும் கிடைக்கவில்லை',
  },
  'leaderboard.standingsInitTitle': {
    en: 'Standings Initializing',
    ta: 'தரவரிசை தொடங்கப்படுகிறது',
  },
  'leaderboard.noMatchingMsg': {
    en: 'No dealerships matched "{query}". Please check your search term or dealer rank number.',
    ta: '"{query}" உடன் எந்த டீலர்ஷிப்களும் பொருந்தவில்லை. தேடல் சொல் அல்லது தரவரிசை எண்ணைச் சரிபார்க்கவும்.',
  },
  'leaderboard.standingsInitMsg': {
    en: 'Leaderboard points calculate automatically following verified auction transactions and dealer actions.',
    ta: 'சரிபார்க்கப்பட்ட ஏலப் பரிவர்த்தனைகள் மற்றும் டீலர் நடவடிக்கைகளைத் தொடர்ந்து முன்னிலை புள்ளிகள் தானாகக் கணக்கிடப்படுகின்றன.',
  },
  'leaderboard.clearSearchBtn': {
    en: 'Clear Search Filter',
    ta: 'தேடல் வடிகட்டியை அழிக்கவும்',
  },
  'leaderboard.paginationShowing': {
    en: 'Showing {start} to {end} of {total} dealerships • Page {page} of {pages}',
    ta: '{total} டீலர்ஷிப்களில் {start} முதல் {end} வரை காட்டப்படுகிறது • பக்கம் {pages} இல் {page}',
  },
  'leaderboard.goToPage': {
    en: 'Go to:',
    ta: 'செல்லவும்:',
  },
  'leaderboard.goBtn': {
    en: 'Go',
    ta: 'செல்',
  },
  'leaderboard.footerAuctions': {
    en: 'High-velocity dealer auctions every Thursday at 2:00 PM • Verified points synced in real-time',
    ta: 'ஒவ்வொரு வியாழக்கிழமையும் மதியம் 2:00 மணிக்கு அதிவேக டீலர் ஏலங்கள் • சரிபார்க்கப்பட்ட புள்ளிகள் நிகழ்நேரத்தில் ஒத்திசைக்கப்படுகின்றன',
  },
  'leaderboard.footerTermsBtn': {
    en: 'Official Terms & Conditions (Buyer & Seller Leagues)',
    ta: 'அதிகாரப்பூர்வ விதிமுறைகள் & நிபந்தனைகள் (வாங்குபவர் & விற்பனையாளர் லீகுகள்)',
  },
  'leaderboard.footerTermsPage': {
    en: 'Standalone Terms Page',
    ta: 'தனி விதிமுறைகள் பக்கம்',
  },
  'leaderboard.loadingText': {
    en: 'Loading leaderboard...',
    ta: 'முன்னிலை பட்டியல் ஏற்றப்படுகிறது...',
  },

  // ── Login / Sign-In Page Translations ──
  'login.badge': {
    en: 'Live 2026–27 Championship',
    ta: 'நேரலை 2026–27 சாம்பியன்ஷிப்',
  },
  'login.titlePrefix': {
    en: 'TVS Dealer',
    ta: 'டிவிஎஸ் டீலர்',
  },
  'login.titleHighlight': {
    en: 'Super Cup',
    ta: 'சூப்பர்கப்',
  },
  'login.desc': {
    en: 'The official live championship for certified dealerships across India. Earn rank points on every verified auction transaction, compete on the national leaderboard, and win podium cash awards.',
    ta: 'இந்தியா முழுவதும் உள்ள சான்றளிக்கப்பட்ட டீலர்ஷிப்களுக்கான அதிகாரப்பூர்வ நேரடி சாம்பியன்ஷிப். சரிபார்க்கப்பட்ட ஒவ்வொரு ஏலப் பரிவர்த்தனையிலும் தரவரிசைப் புள்ளிகளைப் பெற்று, தேசிய முன்னிலை அட்டவணையில் போட்டியிட்டு, போடியம் ரொக்கப் பரிசுகளை வெல்லுங்கள்.',
  },
  'login.podiumCard': {
    en: '₹50,000 Cash Podium',
    ta: '₹50,000 போடியம் ரொக்கப் பரிசு',
  },
  'login.podiumSub': {
    en: 'Awarded to top performing buyer and seller dealerships.',
    ta: 'சிறந்த வாங்குபவர் மற்றும் விற்பனையாளர் டீலர்ஷிப்களுக்கு வழங்கப்படுகிறது.',
  },
  'login.realtimeCard': {
    en: 'Real-Time Scoring',
    ta: 'நிகழ்நேர மதிப்பெண்',
  },
  'login.realtimeSub': {
    en: 'Instant telemetry and automated points calculation synced to every auction.',
    ta: 'ஒவ்வொரு ஏலத்துடனும் ஒத்திசைக்கப்பட்ட உடனடி டெலிமெட்ரி மற்றும் தானியங்கி புள்ளி கணக்கீடு.',
  },
  'login.networkCard': {
    en: 'TVS Certified Network',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட நெட்வொர்க்',
  },
  'login.networkSub': {
    en: 'Official corporate portal with single sign-on security and verifiable competition standards.',
    ta: 'ஒற்றை உள்நுழைவு பாதுகாப்பு மற்றும் சரிபார்க்கக்கூடிய போட்டித் தரங்களைக் கொண்ட அதிகாரப்பூர்வ தளம்.',
  },
  'login.inspectPrompt': {
    en: 'Want to inspect active rankings?',
    ta: 'தற்போதைய தரவரிசையைப் பார்க்க வேண்டுமா?',
  },
  'login.viewLeaderboard': {
    en: 'View Public Leaderboard',
    ta: 'பொது முன்னிலை அட்டவணையைப் பார்க்கவும்',
  },
  'login.portalTag': {
    en: 'Authorized Dealer Portal',
    ta: 'அங்கீகரிக்கப்பட்ட டீலர் தளம்',
  },
  'login.cardHeading': {
    en: 'Dealer Sign In',
    ta: 'டீலர் உள்நுழைவு',
  },
  'login.cardSub': {
    en: 'Enter your credentials to access your live dashboard and competition telemetry.',
    ta: 'நேரடி டாஷ்போர்டு மற்றும் போட்டித் தகவல்களை அணுக உங்கள் விவரங்களை உள்ளிடவும்.',
  },
  'login.idLabel': {
    en: 'Dealer ID, Mobile, or Email',
    ta: 'டீலர் ஐடி, மொபைல் அல்லது மின்னஞ்சல்',
  },
  'login.idPlaceholder': {
    en: 'e.g. murali@tvs.in or 8328416428',
    ta: 'எ.கா. murali@tvs.in அல்லது 8328416428',
  },
  'login.pwdLabel': {
    en: 'Password',
    ta: 'கடவுச்சொல்',
  },
  'login.pwdPlaceholder': {
    en: 'Enter your account password',
    ta: 'உங்கள் கணக்கு கடவுச்சொல்லை உள்ளிடவும்',
  },
  'login.rememberMe': {
    en: 'Remember me',
    ta: 'என்னை நினைவில் கொள்க',
  },
  'login.forgotPwd': {
    en: 'Forgot password?',
    ta: 'கடவுச்சொல் மறந்துவிட்டதா?',
  },
  'login.submitBtn': {
    en: 'Sign In to Dashboard',
    ta: 'டாஷ்போர்டில் உள்நுழைக',
  },
  'login.connectingBtn': {
    en: 'Verifying credentials...',
    ta: 'விவரங்களைச் சரிபார்க்கிறது...',
  },
  'login.trustSeal': {
    en: 'TVS Certified Network',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட நெட்வொர்க்',
  },
  'login.assistTitle': {
    en: 'Account Assistance',
    ta: 'கணக்கு உதவி',
  },
  'login.assistSub': {
    en: 'TVS Certified Dealer Support',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட டீலர் ஆதரவு',
  },
  'login.assistDesc': {
    en: 'Your Super Cup login uses your official TVS Certified Auction Portal credentials. If your password has expired or you need a reset, please contact the helpdesk:',
    ta: 'உங்கள் சூப்பர்கப் உள்நுழைவு அதிகாரப்பூர்வ டிவிஎஸ் சான்றளிக்கப்பட்ட ஏலத் தள விவரங்களைப் பயன்படுத்துகிறது. உங்கள் கடவுச்சொல் காலாவதியாகிவிட்டால் அல்லது மீட்டமைக்க வேண்டுமானால், உதவி மையத்தைத் தொடர்பு கொள்ளவும்:',
  },
  'login.phoneHelpDesk': {
    en: 'Phone Help Desk',
    ta: 'தொலைபேசி உதவி மையம்',
  },
  'login.supportEmail': {
    en: 'Support Email',
    ta: 'ஆதரவு மின்னஞ்சல்',
  },
  'login.closeBtn': {
    en: 'Close',
    ta: 'மூடுக',
  },
  'login.errEmptyId': {
    en: 'Please enter your Dealer ID, Mobile, or Email.',
    ta: 'உங்கள் டீலர் ஐடி, மொபைல் அல்லது மின்னஞ்சலை உள்ளிடவும்.',
  },
  'login.errEmptyPwd': {
    en: 'Please enter your account password.',
    ta: 'உங்கள் கணக்கு கடவுச்சொல்லை உள்ளிடவும்.',
  },
  'login.errNetwork': {
    en: 'Unable to connect to authentication service. Please check your network connection.',
    ta: 'அங்கீகார சேவையுடன் இணைக்க முடியவில்லை. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.',
  },
  'login.verifyingSession': {
    en: 'Verifying secure session...',
    ta: 'பாதுகாப்பான அமர்வைச் சரிபார்க்கிறது...',
  },

  // ── Standalone Terms Page Translations ──
  'terms.officialTermsBadge': {
    en: 'OFFICIAL TERMS',
    ta: 'அதிகாரப்பூர்வ விதிமுறைகள்',
  },
  'terms.backToStandings': {
    en: 'Back to Standings',
    ta: 'தரவரிசைக்குத் திரும்பு',
  },
  'terms.navTerms': {
    en: 'Terms & Conditions',
    ta: 'விதிமுறைகள் & நிபந்தனைகள்',
  },
  'terms.navDashboard': {
    en: 'Dashboard',
    ta: 'டாஷ்போர்டு',
  },
  'terms.navLeaderboard': {
    en: 'Leaderboard',
    ta: 'முன்னிலை பட்டியல்',
  },
  'terms.heroEyebrow': {
    en: 'TVS Certified Dealer Super Cup 2026–27',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட டீலர் சூப்பர்கப் 2026–27',
  },
  'terms.heroTitle': {
    en: 'Official Terms & Conditions',
    ta: 'அதிகாரப்பூர்வ விதிமுறைகள் & நிபந்தனைகள்',
  },
  'terms.heroSubtitle': {
    en: 'Comprehensive rules, scoring formulas, league divisions, and prize distribution policies. Transparent, audited, and telemetry-verified competition across all registered dealerships.',
    ta: 'முழுமையான விதிகள், மதிப்பெண் சூத்திரங்கள், லீக் பிரிவுகள் மற்றும் பரிசு விநியோகக் கொள்கைகள். பதிவுசெய்யப்பட்ட அனைத்து டீலர்ஷிப்களிலும் வெளிப்படையான, தணிக்கை செய்யப்பட்ட மற்றும் டெலிமெட்ரி மூலம் சரிபார்க்கப்பட்ட போட்டி.',
  },
  'terms.seasonDates': {
    en: 'Season: 15 Oct 2026 – 14 Jan 2027',
    ta: 'சீசன்: 15 அக் 2026 – 14 ஜன 2027',
  },
  'terms.prizePurse': {
    en: 'Prize Purse: ₹1,00,000 (₹1 Lakh)',
    ta: 'பரிசுத் தொகை: ₹1,00,000 (₹1 லட்சம்)',
  },
  'terms.auditedCompliance': {
    en: 'Audited Compliance',
    ta: 'தணிக்கை செய்யப்பட்ட இணக்கம்',
  },
  'terms.sec1Title': {
    en: '1. Championship Structure & League Separation',
    ta: '1. சாம்பியன்ஷிப் கட்டமைப்பு & லீக் பிரிப்பு',
  },
  'terms.sec1Intro': {
    en: 'The TVS Certified Super Cup operates under a dual-league tournament format. Dealerships compete in two separate streams based on their platform activities:',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட சூப்பர்கப் இரட்டை லீக் போட்டி வடிவத்தில் இயங்குகிறது. டீலர்ஷிப்கள் தங்களது தள செயல்பாடுகளின் அடிப்படையில் இரண்டு தனித்தனி பிரிவுகளில் போட்டியிடுகின்றன:',
  },
  'terms.sec1BuyerLeague': {
    en: 'Buyer League',
    ta: 'வாங்குபவர் லீக்',
  },
  'terms.sec1BuyerDesc': {
    en: 'Ranked strictly by Buyer Points earned from bidding on unique cars, attending live auction sessions, and earning the All-Matches Attendance Bonus.',
    ta: 'தனித்தனி கார்களில் ஏலம் எடுத்தல், நேரடி ஏல அமர்வுகளில் பங்கேற்றல் மற்றும் அனைத்து அமர்வுகள் வருகை போனஸ் ஆகியவற்றின் மூலம் பெறப்பட்ட வாங்குபவர் புள்ளிகளால் மட்டுமே தரவரிசைப்படுத்தப்படுகிறது.',
  },
  'terms.sec1SellerLeague': {
    en: 'Seller League',
    ta: 'விற்பனையாளர் லீக்',
  },
  'terms.sec1SellerDesc': {
    en: 'Ranked strictly by Seller Points earned from publishing vehicle auction consignments and verified commission settlements.',
    ta: 'வாகன ஏலப் பட்டியல்களை வெளியிடுதல் மற்றும் சரிபார்க்கப்பட்ட கமிஷன் தீர்வுகள் மூலம் பெறப்பட்ட விற்பனையாளர் புள்ளிகளால் மட்டுமே தரவரிசைப்படுத்தப்படுகிறது.',
  },
  'terms.sec1CrucialRule': {
    en: 'Crucial Regulation — No Total Dealer Points:',
    ta: 'முக்கியமான ஒழுங்குமுறை — மொத்த டீலர் புள்ளிகள் சேர்க்கப்படாது:',
  },
  'terms.sec1CrucialDesc': {
    en: 'Buyer points and Seller points are not combined. Awards, cash prizes, and leaderboard standings are awarded strictly inside the separate Buyer League and Seller League. Total dealer score is not used to determine any tournament winners.',
    ta: 'வாங்குபவர் புள்ளிகள் மற்றும் விற்பனையாளர் புள்ளிகள் ஒன்றாக இணைக்கப்பட மாட்டாது. விருதுகள், ரொக்கப் பரிசுகள் மற்றும் முன்னிலை தரவரிசைகள் தனித்தனி வாங்குபவர் லீக் மற்றும் விற்பனையாளர் லீகில் மட்டுமே வழங்கப்படும். எந்தவொரு போட்டியிலும் வெற்றியாளர்களைத் தீர்மானிக்க மொத்த டீலர் மதிப்பெண் பயன்படுத்தப்படாது.',
  },
  'terms.sec2Title': {
    en: '2. Buyer Terms & Scoring Allocation',
    ta: '2. வாங்குபவர் விதிமுறைகள் & புள்ளி ஒதுக்கீடு',
  },
  'terms.sec2BidsTitle': {
    en: 'Auction Bids (Per-Car Basis): 1 Point Per Unique Vehicle',
    ta: 'ஏலங்கள் (ஒரு கார் அடிப்படையில்): தனித்தனி வாகனத்திற்கு 1 புள்ளி',
  },
  'terms.sec2BidsDesc': {
    en: 'Bidding points are strictly awarded on a per-car basis. Placing one or more bids on a vehicle lot awards exactly 1 point for that car. Multiple bids or increments on the same vehicle lot do not yield additional points. This policy prevents point farming on single lots and rewards active multi-lot bidding participation.',
    ta: 'ஏலப் புள்ளிகள் கண்டிப்பாக ஒரு கார் அடிப்படையில் மட்டுமே வழங்கப்படும். ஒரு வாகன லாட்டில் ஒன்று அல்லது அதற்கு மேற்பட்ட ஏலங்களை வைப்பது அந்த காருக்கு சரியாக 1 புள்ளியை வழங்குகிறது. ஒரே வாகன லாட்டில் பல ஏலங்கள் வைப்பது கூடுதல் புள்ளிகளை அளிக்காது. இது ஒரே லாட்டில் முறைகேடாக புள்ளிகள் குவிப்பதைத் தடுக்கிறது மற்றும் பல லாட்டுகளில் தீவிரமாக ஏலம் கேட்பதை ஊக்குவிக்கிறது.',
  },
  'terms.sec2AttendanceTitle': {
    en: 'Match Day Participation: 1 Point Per Thursday Match',
    ta: 'ஏல நாள் பங்கேற்பு: வியாழக்கிழமை ஏலத்திற்கு 1 புள்ளி',
  },
  'terms.sec2AttendanceDesc': {
    en: 'Logging in and actively participating in an official Thursday 2:00 PM auction session earns 1 attendance point per match day.',
    ta: 'வியாழக்கிழமை மதியம் 2:00 மணிக்கு நடைபெறும் அதிகாரப்பூர்வ ஏல அமர்வில் உள்நுழைந்து தீவிரமாகப் பங்கேற்பது ஒரு போட்டி நாளுக்கு 1 வருகைப் புள்ளியைப் பெற்றுத் தரும்.',
  },
  'terms.sec2BonusTitle': {
    en: 'All-Matches Attendance Bonus: +20 Points',
    ta: 'அனைத்து போட்டிகள் வருகை போனஸ்: +20 புள்ளிகள்',
  },
  'terms.sec2BonusDesc': {
    en: 'Dealers who maintain flawless attendance and participate in all 14 official Thursday matches throughout the campaign unlock a massive 20-point loyalty bonus at season conclusion.',
    ta: 'பிரச்சார காலம் முழுவதும் அனைத்து 14 அதிகாரப்பூர்வ வியாழக்கிழமை போட்டிகளிலும் தவறாமல் கலந்துகொள்ளும் டீலர்கள் சீசன் முடிவில் பெரும் +20 போனஸ் புள்ளிகளைப் பெறுவார்கள்.',
  },
  'terms.sec3Title': {
    en: '3. Seller Terms & Scoring Allocation',
    ta: '3. விற்பனையாளர் விதிமுறைகள் & புள்ளி ஒதுக்கீடு',
  },
  'terms.sec3ListingsTitle': {
    en: 'Vehicle Listings: 5 Points Per Published Vehicle',
    ta: 'வாகனப் பட்டியல்கள்: வெளியிடப்பட்ட வாகனத்திற்கு 5 புள்ளிகள்',
  },
  'terms.sec3ListingsDesc': {
    en: 'Earn 5 points for every inspected and verified vehicle lot listed into the TVS Certified auction network.',
    ta: 'டிவிஎஸ் சான்றளிக்கப்பட்ட ஏல வலையமைப்பில் ஆய்வு செய்யப்பட்டு பட்டியலிடப்படும் ஒவ்வொரு வாகனத்திற்கும் 5 புள்ளிகளைப் பெறுங்கள்.',
  },
  'terms.sec3SettlementTitle': {
    en: 'Commission Settlements: 5 Points Per Settled Transaction',
    ta: 'கமிஷன் தீர்வுகள்: தீர்வு செய்யப்பட்ட பரிவர்த்தனைக்கு 5 புள்ளிகள்',
  },
  'terms.sec3SettlementDesc': {
    en: 'Earn 5 points for every successfully closed and settled vehicle transaction following auction conclusion.',
    ta: 'ஏல முடிவைத் தொடர்ந்து வெற்றிகரமாக முடிக்கப்பட்டு தீர்வு செய்யப்பட்ட ஒவ்வொரு வாகனப் பரிவர்த்தனைக்கும் 5 புள்ளிகளைப் பெறுங்கள்.',
  },
  'terms.sec4Title': {
    en: '4. Grand Finale Awards & Cash Distribution',
    ta: '4. கிராண்ட் ஃபைனலே பரிசுகள் & ரொக்கப் பகிர்வு',
  },
  'terms.sec4BuyerPodium': {
    en: 'Buyer League Podium (₹50,000 Total)',
    ta: 'வாங்குபவர் லீக் போடியம் (மொத்தம் ₹50,000)',
  },
  'terms.sec4SellerPodium': {
    en: 'Seller League Podium (₹50,000 Total)',
    ta: 'விற்பனையாளர் லீக் போடியம் (மொத்தம் ₹50,000)',
  },
  'terms.sec41stPlace': {
    en: '1st Place Champion: ₹25,000 Cash Purse + Trophy',
    ta: '1வது இடம் சாம்பியன்: ₹25,000 ரொக்கப் பரிசு + கோப்பை',
  },
  'terms.sec42ndPlace': {
    en: '2nd Place Runner-Up: ₹15,000 Cash Purse + Silver Plaque',
    ta: '2வது இடம் ரன்னர்-அப்: ₹15,000 ரொக்கப் பரிசு + வெள்ளிப் பலகை',
  },
  'terms.sec43rdPlace': {
    en: '3rd Place 2nd Runner-Up: ₹10,000 Cash Purse + Bronze Plaque',
    ta: '3வது இடம் 2வது ரன்னர்-அப்: ₹10,000 ரொக்கப் பரிசு + வெண்கலப் பலகை',
  },
  'terms.sec4TieSplit': {
    en: 'Equal Points Tie-Breaker Policy (Split Purse):',
    ta: 'சம புள்ளிகள் சமநிலை விதி (பரிசுப் பகிர்வு):',
  },
  'terms.sec4TieSplitDesc': {
    en: 'If two or more dealerships tie on total league points for any podium spot, the combined cash purse of the tied spots is divided equally between the tied dealers. No subjective tie-breakers are used.',
    ta: 'எந்தவொரு போடியம் இடத்திற்கும் இரண்டு அல்லது அதற்கு மேற்பட்ட டீலர்ஷிப்கள் சமமான புள்ளிகளைப் பெற்றால், அந்த இடங்களுக்கான மொத்த ரொக்கப் பரிசு சமமாகப் பிரிக்கப்படும். எந்தவொரு தன்னிச்சையான விதிகளும் பயன்படுத்தப்படாது.',
  },
  'terms.sec5Title': {
    en: '5. Compliance, Disputes & Governance',
    ta: '5. இணக்கம், சர்ச்சைகள் & நிர்வாகம்',
  },
  'terms.sec5Desc': {
    en: 'All telemetry records, bids, and listings are logged by TVS Certified auction systems. In case of discrepancies, the audit trail of the central auction engine shall be final and binding.',
    ta: 'அனைத்து டெலிமெட்ரி பதிவுகள், ஏலங்கள் மற்றும் பட்டியல்கள் டிவிஎஸ் சான்றளிக்கப்பட்ட அமைப்புகளால் பதிவு செய்யப்படுகின்றன. முரண்பாடுகள் ஏற்பட்டால், மத்திய ஏல அமைப்பின் தணிக்கைப் பதிவே இறுதியானது மற்றும் கட்டுப்படுத்தக்கூடியது.',
  },
};

/**
 * Format a translation string with dynamic params (e.g. {dealerName})
 */
export function formatTranslation(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return Object.entries(params).reduce((str, [key, value]) => {
    return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, template);
}
