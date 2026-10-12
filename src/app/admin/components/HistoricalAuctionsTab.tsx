'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Car,
  Users,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  X,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Tag,
  Hash,
  Check,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface AuctionItem {
  id: string;
  code: string;
  title: string;
  branch: 'TN' | 'KL' | 'AP/TS' | 'KA' | 'OTHER';
  branchLabel: string;
  auctionType: 'DAILY' | 'WEEKLY';
  rawType: string;
  scheduledTime: string;
  scheduleEndTime?: string;
  stage: string;
  locationCity: string;
}

interface AuctionVehicle {
  id: number;
  vehicleId: string | number;
  lotNumber: number;
  title: string;
  makeModel: string;
  registrationNumber: string;
  fuelType: string;
  transmission: string;
  yearOfMfg: string | number;
  speedometer: string;
  startBidValue: number;
  winningBidValue: number | null;
  expectedPrice: number;
  stage: string;
  status: string;
  isWon: boolean;
  winnerId: string | null;
  winnerName: string;
  winnerCity: string;
  winnerPhone: string;
  sellerName: string;
  sellerCity: string;
  sellerPhone: string;
  locationName: string;
  imageUrl?: string;
  dateIST: string;
}

interface AuctionBidder {
  id: number;
  buyerId: string;
  name: string;
  phone: string;
  city: string;
  depositAmount: number;
  preBidValue: number | null;
  registeredAtIST: string;
  status: string;
}

interface PulledAuctionData {
  summary: {
    auctionId: string;
    title: string;
    code: string;
    branch: string;
    branchLabel: string;
    auctionType: string;
    scheduledDateIST: string;
    totalVehicles: number;
    soldVehicles: number;
    unsoldVehicles: number;
    totalSalesVolume: number;
    avgSalesPrice: number;
    totalRegisteredBidders: number;
    totalPreBids: number;
  };
  vehicles: AuctionVehicle[];
  bidders: AuctionBidder[];
}

export default function HistoricalAuctionsTab() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [branchFilter, setBranchFilter] = useState<'ALL' | 'TN' | 'KL' | 'AP/TS'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Pulled Auction State
  const [pullingAuctionId, setPullingAuctionId] = useState<string | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<PulledAuctionData | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);
  const [viewerTab, setViewerTab] = useState<'VEHICLES' | 'BIDDERS' | 'SUMMARY'>('VEHICLES');
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'WON' | 'UNSOLD'>('ALL');
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Export State
  const [exportingAuctionId, setExportingAuctionId] = useState<string | null>(null);
  const [exportingCatalog, setExportingCatalog] = useState(false);

  // Load Auctions Directory
  const loadAuctions = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/historical-auctions?action=list${refresh ? '&refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load auctions: HTTP ${res.status}`);
      }
      const data = await res.json();
      setAuctions(data.auctions || []);
      setCounts(data.counts || null);
    } catch (err: any) {
      console.error('Error fetching historical auctions:', err);
      setError(err?.message || 'Failed to fetch historical auctions directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  // Pull data for a specific auction
  const handlePullAuctionData = async (auctionId: string) => {
    setPullingAuctionId(auctionId);
    setPullError(null);
    try {
      const res = await fetch(`/api/admin/historical-auctions?action=pull&auctionId=${encodeURIComponent(auctionId)}`);
      if (!res.ok) {
        throw new Error(`Failed to pull data for auction #${auctionId}: HTTP ${res.status}`);
      }
      const data: PulledAuctionData = await res.json();
      setSelectedAuction(data);
      setViewerTab('VEHICLES');
      setVehicleFilter('ALL');
      setVehicleSearch('');
    } catch (err: any) {
      console.error(`Error pulling auction #${auctionId}:`, err);
      setPullError(err?.message || `Failed to pull data for auction #${auctionId}`);
    } finally {
      setPullingAuctionId(null);
    }
  };

  // Download Excel for a single auction
  const handleDownloadAuctionExcel = (auctionId: string) => {
    setExportingAuctionId(auctionId);
    try {
      const downloadUrl = `/api/admin/historical-auctions?action=export&auctionId=${encodeURIComponent(auctionId)}`;
      window.open(downloadUrl, '_blank');
    } finally {
      setTimeout(() => setExportingAuctionId(null), 1500);
    }
  };

  // Master Extraction State
  const [masterExportStatus, setMasterExportStatus] = useState<'IDLE' | 'FETCHING' | 'PARSING' | 'COMPILING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [masterExportError, setMasterExportError] = useState<string | null>(null);
  const [showMasterExportModal, setShowMasterExportModal] = useState(false);
  const [exportTargetBranch, setExportTargetBranch] = useState<'ALL' | 'TN' | 'KL' | 'AP/TS'>('ALL');

  // Download Master Catalog Excel with Live Progress Feedback
  const handleDownloadMasterCatalog = async (branch: 'ALL' | 'TN' | 'KL' | 'AP/TS' = 'ALL') => {
    setShowMasterExportModal(true);
    setMasterExportStatus('FETCHING');
    setMasterExportError(null);
    setExportTargetBranch(branch);

    try {
      // Step 1: Request extraction from backend
      const branchParam = branch !== 'ALL' ? `&branch=${encodeURIComponent(branch)}` : '';
      const url = `/api/admin/historical-auctions?action=export&type=catalog${branchParam}`;

      // Progressive feedback indicators while large payload compiles
      const statusTimer1 = setTimeout(() => {
        setMasterExportStatus('PARSING');
      }, 3500);

      const statusTimer2 = setTimeout(() => {
        setMasterExportStatus('COMPILING');
      }, 9000);

      const res = await fetch(url);
      clearTimeout(statusTimer1);
      clearTimeout(statusTimer2);

      if (!res.ok) {
        throw new Error(`Master extraction failed with HTTP ${res.status}`);
      }

      setMasterExportStatus('COMPILING');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      const branchName = branch !== 'ALL' ? branch.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Branches';
      a.download = `TVS_Master_Historical_Auctions_Full_Details_${branchName}_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMasterExportStatus('COMPLETE');
    } catch (err: any) {
      console.error('Master export error:', err);
      setMasterExportStatus('ERROR');
      setMasterExportError(err?.message || 'Failed to download master catalog Excel file');
    }
  };

  // Filtered & Sorted Auctions
  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    if (branchFilter !== 'ALL') {
      result = result.filter(a => a.branch === branchFilter);
    }

    if (typeFilter !== 'ALL') {
      result = result.filter(a => a.auctionType === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.locationCity.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
      const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
      if (sortOrder === 'NEWEST') {
        return timeB !== timeA ? timeB - timeA : Number(b.id) - Number(a.id);
      } else {
        return timeA !== timeB ? timeA - timeB : Number(a.id) - Number(b.id);
      }
    });

    return result;
  }, [auctions, branchFilter, typeFilter, searchQuery, sortOrder]);

  // Paginated auctions
  const totalPages = Math.ceil(filteredAuctions.length / pageSize) || 1;
  const paginatedAuctions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAuctions.slice(start, start + pageSize);
  }, [filteredAuctions, currentPage, pageSize]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [branchFilter, typeFilter, searchQuery, pageSize]);

  // Filtered vehicles within selected auction
  const filteredVehicles = useMemo(() => {
    if (!selectedAuction) return [];
    let list = selectedAuction.vehicles;

    if (vehicleFilter === 'WON') {
      list = list.filter(v => v.isWon);
    } else if (vehicleFilter === 'UNSOLD') {
      list = list.filter(v => !v.isWon);
    }

    if (vehicleSearch.trim()) {
      const q = vehicleSearch.toLowerCase().trim();
      list = list.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.winnerName.toLowerCase().includes(q) ||
        v.sellerName.toLowerCase().includes(q) ||
        String(v.lotNumber).includes(q)
      );
    }

    return list;
  }, [selectedAuction, vehicleFilter, vehicleSearch]);

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  return (
    <div className="historical-auctions-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Top Hero & Notification Banner ── */}
      <div className="card double-bezel" style={{ padding: '6px' }}>
        <div className="inner-bezel-core" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)'
                }}>
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Historical Auctions Data Extractor
                    </h2>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      Temporary Feature
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Comprehensive archive across <strong>Tamil Nadu (TN)</strong>, <strong>Kerala (KL)</strong>, and <strong>AP / Telangana (AP/TS)</strong>. Click any auction to pull full inventories, winning bids, buyer/seller identities, and download as Excel (.xlsx).
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Global Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => loadAuctions(true)}
                disabled={loading}
                title="Refresh auctions from TVS Certified server"
                style={{ fontSize: '0.8rem', gap: '6px' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Directory</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setMasterExportStatus('IDLE');
                  setShowMasterExportModal(true);
                }}
                disabled={loading}
                title="Download complete historical dataset with 15,000+ vehicle records as multi-sheet Excel (.xlsx)"
                style={{
                  fontSize: '0.8rem',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#10b981',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Download Master Catalog (Excel)</span>
              </button>
            </div>
          </div>

          {/* KPI Counters Bar */}
          {counts && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Historical Auctions
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {counts.total?.toLocaleString() ?? 0}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)' }}>
                  {counts.types?.DAILY ?? 0} Daily • {counts.types?.WEEKLY ?? 0} Weekly
                </span>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Tamil Nadu (TN)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chennai</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
                  {counts.branches?.TN?.total ?? 0}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {counts.branches?.TN?.daily ?? 0} Daily • {counts.branches?.TN?.weekly ?? 0} Weekly
                </span>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                    Kerala (KL)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kochi</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>
                  {counts.branches?.KL?.total ?? 0}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {counts.branches?.KL?.daily ?? 0} Daily • {counts.branches?.KL?.weekly ?? 0} Weekly
                </span>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                    AP & Telangana (AP/TS)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vijayawada</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24' }}>
                  {counts.branches?.['AP/TS']?.total ?? 0}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {counts.branches?.['AP/TS']?.daily ?? 0} Daily • {counts.branches?.['AP/TS']?.weekly ?? 0} Weekly
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Pulled Auction Inspector View (When An Auction Is Selected / Pulled) ── */}
      {selectedAuction && (
        <div className="card double-bezel" style={{ padding: '6px', border: '1.5px solid #a855f7' }}>
          <div className="inner-bezel-core" style={{ padding: '22px 24px' }}>
            {/* Auction Header & Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: selectedAuction.summary.branch === 'TN' ? 'rgba(56, 189, 248, 0.2)' : selectedAuction.summary.branch === 'KL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: selectedAuction.summary.branch === 'TN' ? '#38bdf8' : selectedAuction.summary.branch === 'KL' ? '#34d399' : '#fbbf24',
                    border: `1px solid ${selectedAuction.summary.branch === 'TN' ? '#38bdf8' : selectedAuction.summary.branch === 'KL' ? '#34d399' : '#fbbf24'}`
                  }}>
                    BRANCH: {selectedAuction.summary.branchLabel}
                  </span>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.4)'
                  }}>
                    {selectedAuction.summary.auctionType === 'DAILY' ? '📅 DAILY AUCTION' : '🏆 WEEKLY AUCTION'}
                  </span>

                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    CODE: {selectedAuction.summary.code}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Auction #{selectedAuction.summary.auctionId} — {selectedAuction.summary.title}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Scheduled Date: <strong>{selectedAuction.summary.scheduledDateIST}</strong>
                </span>
              </div>

              {/* Action Buttons: Download Excel & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadAuctionExcel(selectedAuction.summary.auctionId)}
                  disabled={exportingAuctionId === selectedAuction.summary.auctionId}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#10b981',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    fontWeight: 700
                  }}
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>
                    {exportingAuctionId === selectedAuction.summary.auctionId ? 'Preparing Excel...' : 'Download Excel File (.xlsx)'}
                  </span>
                </button>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedAuction(null)}
                  title="Close Inspector"
                  style={{ padding: '6px' }}
                >
                  <X className="w-5 h-5 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Pulled Auction Metrics Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
              margin: '18px 0'
            }}>
              <div className="admin-stat-card" style={{ padding: '12px 14px' }}>
                <span className="admin-stat-label">Total Vehicles</span>
                <div className="admin-stat-val" style={{ fontSize: '1.4rem' }}>
                  {selectedAuction.summary.totalVehicles}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Listed for bidding</span>
              </div>

              <div className="admin-stat-card" style={{ padding: '12px 14px', borderLeft: '3px solid #10b981' }}>
                <span className="admin-stat-label">Won / Sold</span>
                <div className="admin-stat-val" style={{ color: '#10b981', fontSize: '1.4rem' }}>
                  {selectedAuction.summary.soldVehicles}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#10b981' }}>
                  {selectedAuction.summary.totalVehicles > 0 ? Math.round((selectedAuction.summary.soldVehicles / selectedAuction.summary.totalVehicles) * 100) : 0}% Conversion
                </span>
              </div>

              <div className="admin-stat-card" style={{ padding: '12px 14px' }}>
                <span className="admin-stat-label">Unsold Lots</span>
                <div className="admin-stat-val" style={{ color: 'var(--text-muted)', fontSize: '1.4rem' }}>
                  {selectedAuction.summary.unsoldVehicles}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No bid / unawarded</span>
              </div>

              <div className="admin-stat-card" style={{ padding: '12px 14px', borderLeft: '3px solid #38bdf8' }}>
                <span className="admin-stat-label">Sales Turnover (INR)</span>
                <div className="admin-stat-val" style={{ color: '#38bdf8', fontSize: '1.3rem' }}>
                  {formatCurrency(selectedAuction.summary.totalSalesVolume)}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Avg: {formatCurrency(selectedAuction.summary.avgSalesPrice)} / car
                </span>
              </div>

              <div className="admin-stat-card" style={{ padding: '12px 14px', borderLeft: '3px solid #f59e0b' }}>
                <span className="admin-stat-label">Registered Bidders</span>
                <div className="admin-stat-val" style={{ color: '#f59e0b', fontSize: '1.4rem' }}>
                  {selectedAuction.summary.totalRegisteredBidders}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {selectedAuction.summary.totalPreBids} Pre-bids Placed
                </span>
              </div>
            </div>

            {/* Viewer Sub-Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn btn-sm ${viewerTab === 'VEHICLES' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewerTab('VEHICLES')}
                  style={{ fontSize: '0.8rem', gap: '6px' }}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Vehicle Inventory & Results ({selectedAuction.vehicles.length})</span>
                </button>

                <button
                  className={`btn btn-sm ${viewerTab === 'BIDDERS' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewerTab('BIDDERS')}
                  style={{ fontSize: '0.8rem', gap: '6px' }}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Registered Bidders ({selectedAuction.bidders.length})</span>
                </button>
              </div>

              {/* Vehicle Sub-Filters */}
              {viewerTab === 'VEHICLES' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '2px' }}>
                    {(['ALL', 'WON', 'UNSOLD'] as const).map(tabKey => (
                      <button
                        key={tabKey}
                        onClick={() => setVehicleFilter(tabKey)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          background: vehicleFilter === tabKey ? 'var(--surface-color)' : 'transparent',
                          color: vehicleFilter === tabKey ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {tabKey === 'ALL' ? 'All Cars' : tabKey === 'WON' ? `Won (${selectedAuction.summary.soldVehicles})` : `Unsold (${selectedAuction.summary.unsoldVehicles})`}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search car, reg #, dealer..."
                      style={{ paddingLeft: '28px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px', fontSize: '0.75rem', width: '200px' }}
                      value={vehicleSearch}
                      onChange={e => setVehicleSearch(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 1. Vehicles Table */}
            {viewerTab === 'VEHICLES' && (
              <div style={{ overflowX: 'auto', marginTop: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                <table className="admin-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Lot #</th>
                      <th>Vehicle Description</th>
                      <th>Reg Number</th>
                      <th>Specs</th>
                      <th>Start Bid</th>
                      <th>Winning Bid</th>
                      <th>Winner / Buyer Dealership</th>
                      <th>Seller Dealership</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((v, idx) => (
                      <tr key={v.id || idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)' }}>
                          #{v.lotNumber}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {v.title}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ID: {v.vehicleId} • {v.locationName}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {v.registrationNumber}
                        </td>
                        <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {v.fuelType} • {v.transmission} • {v.yearOfMfg} • {v.speedometer} KM
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(v.startBidValue)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: v.isWon ? '#10b981' : 'var(--text-muted)' }}>
                          {v.winningBidValue ? formatCurrency(v.winningBidValue) : '—'}
                        </td>
                        <td>
                          {v.isWon ? (
                            <div>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{v.winnerName}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {v.winnerCity} {v.winnerPhone ? `• ${v.winnerPhone}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div>
                            <span style={{ color: 'var(--text-primary)' }}>{v.sellerName}</span>
                            {v.sellerCity && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{v.sellerCity}</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${v.isWon ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredVehicles.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No vehicles match the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Registered Bidders Table */}
            {viewerTab === 'BIDDERS' && (
              <div style={{ overflowX: 'auto', marginTop: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                <table className="admin-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>Buyer ID</th>
                      <th>Dealership / Company Name</th>
                      <th>Contact Phone</th>
                      <th>City</th>
                      <th>Deposit (INR)</th>
                      <th>Pre-Bid Value</th>
                      <th>Registered At (IST)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAuction.bidders.map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-blue)' }}>
                          {b.buyerId}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {b.name}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {b.phone || '—'}
                        </td>
                        <td>
                          {b.city || '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {b.depositAmount > 0 ? formatCurrency(b.depositAmount) : '₹0'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: b.preBidValue ? '#38bdf8' : 'var(--text-muted)' }}>
                          {b.preBidValue ? formatCurrency(b.preBidValue) : '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {b.registeredAtIST}
                        </td>
                      </tr>
                    ))}

                    {selectedAuction.bidders.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No registered bidders recorded for this auction session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Filter Bar ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Row: Branch Filters & Type Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {/* Branch Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Branch:
              </span>
              {(['ALL', 'TN', 'KL', 'AP/TS'] as const).map(b => {
                const count = b === 'ALL'
                  ? counts?.total
                  : counts?.branches?.[b]?.total ?? 0;
                return (
                  <button
                    key={b}
                    className={`btn btn-sm ${branchFilter === b ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setBranchFilter(b)}
                    style={{
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: branchFilter === b
                        ? (b === 'TN' ? '#0284c7' : b === 'KL' ? '#059669' : b === 'AP/TS' ? '#d97706' : undefined)
                        : undefined
                    }}
                  >
                    <span>
                      {b === 'ALL' ? 'All Branches' : b === 'TN' ? 'Tamil Nadu (TN)' : b === 'KL' ? 'Kerala (KL)' : 'AP & Telangana (AP/TS)'}
                    </span>
                    {count !== undefined && (
                      <span style={{
                        marginLeft: '4px',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        fontSize: '0.68rem',
                        background: 'rgba(0,0,0,0.25)',
                        color: '#fff'
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Auction Type Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Schedule:
              </span>
              {(['ALL', 'DAILY', 'WEEKLY'] as const).map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    borderRadius: '8px',
                  }}
                >
                  {t === 'ALL' ? 'All Schedules' : t === 'DAILY' ? '📅 Daily Auctions' : '🏆 Weekly Auctions'}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Search & Sort Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter by Auction ID, Code, Title, City..."
                  style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Showing <strong>{filteredAuctions.length}</strong> auctions
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sort:</span>
              <select
                className="form-input"
                style={{ padding: '5px 10px', fontSize: '0.78rem', width: '140px' }}
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
              </select>

              <select
                className="form-input"
                style={{ padding: '5px 10px', fontSize: '0.78rem', width: '90px' }}
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Auctions Directory Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400" style={{ margin: '0 auto 14px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Loading TVS Historical Auctions...</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Retrieving 1,120+ auctions across TN, KL, and AP/TS</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
            <AlertCircle className="w-8 h-8 text-rose-500" style={{ margin: '0 auto 10px' }} />
            <strong style={{ fontSize: '1rem' }}>Failed to Load Auctions</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => loadAuctions(true)} style={{ marginTop: '12px' }}>
              Try Again
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Auction ID</th>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Branch</th>
                  <th>Type</th>
                  <th>Scheduled Date (IST)</th>
                  <th>Location</th>
                  <th>Stage</th>
                  <th style={{ textAlign: 'right', minWidth: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAuctions.map(a => {
                  const isSelected = selectedAuction?.summary?.auctionId === a.id;
                  const isPulling = pullingAuctionId === a.id;
                  const isExporting = exportingAuctionId === a.id;

                  const dateStr = a.scheduledTime ? new Date(a.scheduledTime).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : '—';

                  const timeStr = a.scheduledTime ? new Date(a.scheduledTime).toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) : '';

                  return (
                    <tr
                      key={a.id}
                      style={{
                        background: isSelected ? 'rgba(168, 85, 247, 0.08)' : undefined,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onClick={() => handlePullAuctionData(a.id)}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        #{a.id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-blue)' }}>
                        {a.code}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{a.title}</strong>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: a.branch === 'TN' ? 'rgba(56, 189, 248, 0.15)' : a.branch === 'KL' ? 'rgba(16, 185, 129, 0.15)' : a.branch === 'AP/TS' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: a.branch === 'TN' ? '#38bdf8' : a.branch === 'KL' ? '#34d399' : a.branch === 'AP/TS' ? '#fbbf24' : 'var(--text-muted)',
                          border: `1px solid ${a.branch === 'TN' ? 'rgba(56, 189, 248, 0.3)' : a.branch === 'KL' ? 'rgba(16, 185, 129, 0.3)' : a.branch === 'AP/TS' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`
                        }}>
                          {a.branch}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: a.auctionType === 'DAILY' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                          color: a.auctionType === 'DAILY' ? '#c084fc' : '#38bdf8'
                        }}>
                          {a.auctionType === 'DAILY' ? 'Daily' : 'Weekly'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        <div>{dateStr}</div>
                        {timeStr && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeStr}</span>}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {a.locationCity || '—'}
                      </td>
                      <td>
                        <span className={`badge ${a.stage === 'live' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {a.stage}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handlePullAuctionData(a.id)}
                            disabled={isPulling}
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.75rem',
                              gap: '6px',
                              background: isSelected ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : undefined
                            }}
                          >
                            {isPulling ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Pulling...</span>
                              </>
                            ) : (
                              <>
                                <span>{isSelected ? '✓ Data Loaded' : 'Pull Data'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDownloadAuctionExcel(a.id)}
                            disabled={isExporting}
                            title="Directly download this auction's data in Excel (.xlsx)"
                            style={{
                              padding: '5px 8px',
                              color: '#10b981',
                              borderColor: 'rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedAuctions.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      No auctions found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredAuctions.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-base)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredAuctions.length} total auctions)
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.75rem', margin: '0 6px', fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Master Catalog Extraction Modal ── */}
      {showMasterExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="card double-bezel" style={{
            maxWidth: '680px',
            width: '100%',
            padding: '6px',
            border: '1.5px solid #10b981',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.25)',
          }}>
            <div className="inner-bezel-core" style={{ padding: '24px 28px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}>
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Download Master Historical Auctions Catalog (.xlsx)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                      Exports 15,061 individual vehicle records across all 1,129 historical auctions
                    </p>
                  </div>
                </div>

                {masterExportStatus !== 'FETCHING' && masterExportStatus !== 'PARSING' && masterExportStatus !== 'COMPILING' && (
                  <button
                    onClick={() => {
                      setShowMasterExportModal(false);
                      setMasterExportStatus('IDLE');
                      setMasterExportError(null);
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Data Specifications Card */}
              <div style={{
                background: 'var(--bg-base)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                  What&apos;s Included In Every Row (31 Comprehensive Columns):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Final Bid Value</strong> (Won/Sold price for every vehicle)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Buyer Dealership Name</strong>, City &amp; Contact Phone</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Seller Dealership / Company</strong> &amp; Contact Person</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Registration Number</strong>, Make, Model &amp; Variant</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Fuel, Transmission, Year, Odometer &amp; Ownership</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Reserve Price, Start Bid &amp; Outcome Status</strong></span>
                  </div>
                </div>
              </div>

              {/* Branch Scope Options (when IDLE) */}
              {masterExportStatus === 'IDLE' && (
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Select Branch Scope:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <button
                      onClick={() => setExportTargetBranch('ALL')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `1.5px solid ${exportTargetBranch === 'ALL' ? '#10b981' : 'var(--border-subtle)'}`,
                        background: exportTargetBranch === 'ALL' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-base)',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: exportTargetBranch === 'ALL' ? '#10b981' : 'var(--text-primary)' }}>
                        🌐 All Branches Combined
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        15,061 Cars across TN, KL, AP/TS (5 Excel sheets)
                      </div>
                    </button>

                    <button
                      onClick={() => setExportTargetBranch('TN')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `1.5px solid ${exportTargetBranch === 'TN' ? '#38bdf8' : 'var(--border-subtle)'}`,
                        background: exportTargetBranch === 'TN' ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-base)',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: exportTargetBranch === 'TN' ? '#38bdf8' : 'var(--text-primary)' }}>
                        📍 Tamil Nadu (TN)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        11,980 Vehicles in Chennai &amp; TN yards
                      </div>
                    </button>

                    <button
                      onClick={() => setExportTargetBranch('KL')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `1.5px solid ${exportTargetBranch === 'KL' ? '#34d399' : 'var(--border-subtle)'}`,
                        background: exportTargetBranch === 'KL' ? 'rgba(52, 211, 153, 0.12)' : 'var(--bg-base)',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: exportTargetBranch === 'KL' ? '#34d399' : 'var(--text-primary)' }}>
                        📍 Kerala (KL)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        2,975 Vehicles in Kochi &amp; KL yards
                      </div>
                    </button>

                    <button
                      onClick={() => setExportTargetBranch('AP/TS')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `1.5px solid ${exportTargetBranch === 'AP/TS' ? '#fbbf24' : 'var(--border-subtle)'}`,
                        background: exportTargetBranch === 'AP/TS' ? 'rgba(251, 191, 36, 0.12)' : 'var(--bg-base)',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: exportTargetBranch === 'AP/TS' ? '#fbbf24' : 'var(--text-primary)' }}>
                        📍 AP &amp; Telangana (AP/TS)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        106 Vehicles in Vijayawada &amp; AP yards
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Extraction Progress Stepper */}
              {masterExportStatus !== 'IDLE' && (
                <div style={{
                  background: 'var(--bg-base)',
                  borderRadius: '10px',
                  padding: '18px 20px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    {masterExportStatus === 'COMPLETE' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : masterExportStatus === 'ERROR' ? (
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                    ) : (
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    )}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {masterExportStatus === 'FETCHING' && 'Step 1/3: Pulling 15,061 Records from TVS Live Backend...'}
                        {masterExportStatus === 'PARSING' && 'Step 2/3: Cross-referencing Buyer & Seller Dealerships...'}
                        {masterExportStatus === 'COMPILING' && 'Step 3/3: Formatting 31 Data Columns in Excel (.xlsx)...'}
                        {masterExportStatus === 'COMPLETE' && '✓ Download Complete & Saved!'}
                        {masterExportStatus === 'ERROR' && 'Extraction Failed'}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {masterExportStatus === 'FETCHING' && 'Downloading full catalog payload (~15MB compressed)...'}
                        {masterExportStatus === 'PARSING' && 'Matching 1,509 customer profiles for full dealership names and contact numbers...'}
                        {masterExportStatus === 'COMPILING' && 'Applying sheet auto-sizing and generating final multi-tab workbook...'}
                        {masterExportStatus === 'COMPLETE' && 'File has been pushed to your browser download manager.'}
                        {masterExportStatus === 'ERROR' && (masterExportError || 'An error occurred during extraction')}
                      </p>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  {masterExportStatus !== 'COMPLETE' && masterExportStatus !== 'ERROR' && (
                    <div style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '3px',
                        background: 'linear-gradient(90deg, #10b981 0%, #a855f7 50%, #38bdf8 100%)',
                        width: masterExportStatus === 'FETCHING' ? '40%' : masterExportStatus === 'PARSING' ? '70%' : '90%',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {masterExportStatus === 'IDLE' ? (
                  <>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setShowMasterExportModal(false)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleDownloadMasterCatalog(exportTargetBranch)}
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        gap: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderColor: '#10b981',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>Start Master Download (.xlsx)</span>
                    </button>
                  </>
                ) : masterExportStatus === 'ERROR' ? (
                  <>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setShowMasterExportModal(false)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Close
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleDownloadMasterCatalog(exportTargetBranch)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Retry Download
                    </button>
                  </>
                ) : masterExportStatus === 'COMPLETE' ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowMasterExportModal(false);
                      setMasterExportStatus('IDLE');
                    }}
                    style={{ fontSize: '0.85rem', background: '#10b981', borderColor: '#10b981' }}
                  >
                    Done
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost"
                    disabled
                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
                  >
                    Extracting data, please don&apos;t close this window...
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
