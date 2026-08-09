import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, ChefHat, CheckCircle2, UserCheck, Bell, RefreshCw, 
  Filter, MapPin, SlidersHorizontal, AlertCircle, Volume2, UtensilsCrossed
} from 'lucide-react';
import { Order, WaiterCall, Branch } from '../types';
import { playChime } from './AudioAlert';
import { socket } from '../socket';

interface DashboardViewProps {
  branches: Branch[];
  session?: any;
  onLogout?: () => void;
}

export default function DashboardView({ branches, session, onLogout }: DashboardViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(session?.branchId || 'all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'kds' | 'cashier'>('kds');

  // FIXED: Apply KDS theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'kds');
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  // Keep branch locked to staff session if applicable
  useEffect(() => {
    if (session && session.role === 'staff' && session.branchId) {
      setSelectedBranchId(session.branchId);
    }
  }, [session]);

  // Track previous order count to detect new orders and sound the chime
  const [prevOrderCount, setPrevOrderCount] = useState<number | null>(null);
  const [prevCallCount, setPrevCallCount] = useState<number | null>(null);

  // Fetch orders and calls
  const fetchData = async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      // 1. Fetch Orders
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.status === 401 || ordersRes.status === 403) {
        onLogout?.();
        return;
      }
      if (ordersRes.ok) {
        const ordersData: Order[] = await ordersRes.json();
        setOrders(ordersData);

        // Sound chime if new order arrives
        if (prevOrderCount !== null && ordersData.length > prevOrderCount) {
          if (soundEnabled) {
            playChime('new_order');
          }
        }
        setPrevOrderCount(ordersData.length);
      }

      // 2. Fetch Waiter Calls
      const callsRes = await fetch('/api/waiter-calls');
      if (callsRes.ok) {
        const callsData: WaiterCall[] = await callsRes.json();
        const pendingCalls = callsData.filter(c => c.status === 'Pending');
        setWaiterCalls(callsData);

        // Sound chime if new waiter call arrives
        if (prevCallCount !== null && pendingCalls.length > prevCallCount) {
          if (soundEnabled) {
            playChime('waiter');
          }
        }
        setPrevCallCount(pendingCalls.length);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (isManual) setLoading(false);
    }
  };

  // Poll server as a safety-net fallback; real-time Socket.IO events (below)
  // handle the instant updates, so this only needs to run occasionally.
  useEffect(() => {
    fetchData(); // initial load
    const interval = setInterval(() => fetchData(), 20000);
    return () => clearInterval(interval);
  }, [prevOrderCount, prevCallCount, soundEnabled]);

  // Real-time updates via Socket.IO — new orders, status changes, and
  // waiter calls appear instantly instead of waiting for the next poll.
  useEffect(() => {
    const onOrderNew = () => { if (soundEnabled) playChime('new_order'); fetchData(); };
    const onOrderUpdated = () => fetchData();
    const onWaiterNew = () => { if (soundEnabled) playChime('waiter'); fetchData(); };
    const onWaiterUpdated = () => fetchData();

    socket.on('order:new', onOrderNew);
    socket.on('order:updated', onOrderUpdated);
    socket.on('waiterCall:new', onWaiterNew);
    socket.on('waiterCall:updated', onWaiterUpdated);

    return () => {
      socket.off('order:new', onOrderNew);
      socket.off('order:updated', onOrderUpdated);
      socket.off('waiterCall:new', onWaiterNew);
      socket.off('waiterCall:updated', onWaiterUpdated);
    };
  }, [soundEnabled]);

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'Pending' | 'Cooking' | 'Ready' | 'Served') => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        playChime('success');
      } else if (res.status === 401 || res.status === 403) {
        onLogout?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve waiter call
  const handleResolveCall = async (callId: string) => {
    try {
      const res = await fetch(`/api/waiter-calls/${callId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Addressed' })
      });
      if (res.ok) {
        setWaiterCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'Addressed' } : c));
        playChime('success');
      } else if (res.status === 401 || res.status === 403) {
        onLogout?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter orders by branch
  const filteredOrders = orders.filter(o => {
    if (selectedBranchId === 'all') return true;
    return o.branchId === selectedBranchId;
  });

  const filteredCalls = waiterCalls.filter(c => {
    if (selectedBranchId === 'all') return true;
    return c.branchId === selectedBranchId;
  });

  // Calculate elapsed time formatted
  const getElapsedTime = (isoString: string) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(elapsedMs / 1000 / 60);
    if (mins < 1) return 'Just now';
    return `${mins}m ago`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-6 relative">
      {/* Background radial ambient lights */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header section (Immersive UI Layout & Branding) */}
      <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-30 p-4 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Immersive UI Brand Block */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shadow-orange-glow">
              <span className="font-bold text-black text-xl">B</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight uppercase flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span>Al-Brazin <span className="text-amber-500 italic">Restaurants & Co.</span></span>
                <span className="text-[10px] text-neutral-400 font-normal lowercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-full w-fit">KDS Staff Portal</span>
              </h1>
              <p className="text-neutral-400 text-[10px] mt-0.5">
                Kitchen Display System & Real-time Orders Tracker
              </p>
            </div>
          </div>

          {/* System status pill from Design */}
          <div className="flex items-center gap-4 text-xs text-gray-400 border-l border-white/10 pl-4 h-12">
            <span className="flex flex-col">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full shadow-green-glow animate-pulse"></span>
                Active Connection
              </span>
              {session && (
                <span className="text-[11px] font-bold text-amber-500 mt-1">
                  👤 Logged: {session.username} ({session.branchId ? branches.find(b => b.id === session.branchId)?.name : 'All Branches'})
                </span>
              )}
            </span>
            <span className="px-2.5 py-0.5 bg-white/5 rounded-full border border-white/10 text-[10px] hidden md:inline">
              Secure Cloud Sync
            </span>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playChime('success');
            }}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              soundEnabled 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-orange-glow' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{soundEnabled ? 'Alert Audio: ON' : 'Alert Audio: OFF'}</span>
          </button>

          {/* Branch Filter dropdown */}
          <div className="flex items-center space-x-2 bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-neutral-300">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={session?.role === 'staff'}
              className="bg-transparent focus:outline-none text-neutral-100 font-semibold cursor-pointer disabled:cursor-not-allowed disabled:text-amber-500"
            >
              {session?.role === 'staff' ? (
                <option value={session.branchId || 'all'} className="bg-neutral-900">
                  {branches.find(b => b.id === session.branchId)?.name || session.branchName}
                </option>
              ) : (
                <>
                  <option value="all" className="bg-neutral-900">All Restaurant Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-neutral-900">{b.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Tabs switcher (Kitchen / Cashier) */}
      <div className="flex space-x-1.5 mb-6 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800/80 max-w-md">
        <button
          onClick={() => setActiveTab('kds')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-black flex items-center justify-center space-x-2 transition ${
            activeTab === 'kds' 
              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Kitchen Display System (KDS)</span>
          {filteredOrders.filter(o => o.status === 'Pending' || o.status === 'Cooking').length > 0 && (
            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              {filteredOrders.filter(o => o.status === 'Pending' || o.status === 'Cooking').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cashier')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-black flex items-center justify-center space-x-2 transition ${
            activeTab === 'cashier' 
              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Cashier Terminal</span>
          {filteredOrders.filter(o => o.status === 'Ready').length > 0 && (
            <span className="bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              {filteredOrders.filter(o => o.status === 'Ready').length}
            </span>
          )}
        </button>
      </div>

      {/* DASHBOARD GRID CONTENT */}
      {activeTab === 'kds' ? (
        /* TAB 1: KITCHEN DISPLAY SYSTEM GRID (Pending & Cooking) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders
              .filter(o => o.status === 'Pending' || o.status === 'Cooking')
              .map(order => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className={`bg-neutral-900 border rounded-2xl p-4 flex flex-col justify-between shadow-xl relative ${
                    order.status === 'Pending' 
                      ? 'border-orange-500/40 shadow-orange-950/10' 
                      : 'border-amber-500/40 shadow-amber-950/10 bg-amber-950/5'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] bg-neutral-800 font-extrabold text-neutral-300 px-2 py-0.5 rounded-full">
                          #{order.id.slice(-4)}
                        </span>
                        <h3 className="font-extrabold text-neutral-200 text-xs mt-1">
                          Table {order.tableNumber} • <span className="text-amber-500">{order.area}</span>
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          order.status === 'Pending' 
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {order.status}
                        </span>
                        <div className="flex items-center text-[10px] text-neutral-400 mt-1 space-x-1 justify-end">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{getElapsedTime(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-3">
                      📍 {order.branchName}
                    </p>

                    {/* Ordered items list */}
                    <div className="border-t border-b border-neutral-800/80 py-3 mb-4 space-y-2.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-bold text-neutral-300">
                          <span>
                            {item.name} <strong className="text-amber-400 ml-1">x{item.quantity}</strong>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 mb-4">
                        <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-black block mb-0.5">Note / Requests:</span>
                        <p className="text-[11px] text-orange-400 font-medium leading-relaxed">
                          ⚠️ {order.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* KDS Kitchen Actions */}
                  <div>
                    {order.status === 'Pending' ? (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'Cooking')}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black text-xs py-2.5 rounded-xl transition shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-1.5"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'Ready')}
                        className="w-full bg-green-500 hover:bg-green-400 text-neutral-950 font-black text-xs py-2.5 rounded-xl transition shadow-lg shadow-green-500/10 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Order Ready</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>

          {filteredOrders.filter(o => o.status === 'Pending' || o.status === 'Cooking').length === 0 && (
            <div className="col-span-full bg-neutral-900/40 border border-neutral-850 rounded-2xl p-12 text-center text-neutral-500">
              <ChefHat className="w-12 h-12 text-neutral-700 stroke-1 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-bold">Kitchen Clear! No orders cooking.</p>
              <p className="text-xs text-neutral-600 mt-1">Pending orders will immediately flash and sound alerts here.</p>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: CASHIER TERMINAL (Ready orders & Waiter Alerts) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ready Orders section (Left Column - 2 Col Span) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-green-400 mb-2 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Service ({filteredOrders.filter(o => o.status === 'Ready').length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders
                  .filter(o => o.status === 'Ready')
                  .map(order => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-neutral-900 border border-green-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 font-black px-2 py-0.5 rounded-full">
                              READY #{order.id.slice(-4)}
                            </span>
                            <h3 className="font-extrabold text-neutral-200 text-xs mt-1">
                              Table {order.tableNumber} • <span className="text-amber-500">{order.area}</span>
                            </h3>
                          </div>
                          <div className="text-right text-[10px] text-neutral-400">
                            <Clock className="w-3.5 h-3.5 text-neutral-500 inline-block mr-1" />
                            <span>{getElapsedTime(order.createdAt)}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral-500 font-semibold uppercase block mb-3">
                          📍 {order.branchName}
                        </p>

                        <div className="border-t border-neutral-800/80 py-2.5 mb-4 space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold text-neutral-300">
                              <span>{item.name} <strong className="text-green-400">x{item.quantity}</strong></span>
                            </div>
                          ))}
                        </div>

                        {/* Payment details */}
                        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-[11px] mb-4 flex justify-between">
                          <span className="text-neutral-400">Method: <strong className="text-neutral-200 uppercase">{order.paymentMethod}</strong></span>
                          <span className="font-bold text-amber-500">{order.totalAmount} SAR</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'Served')}
                        className="w-full bg-green-500 hover:bg-green-400 text-neutral-950 font-black text-xs py-2.5 rounded-xl transition shadow-lg shadow-green-500/10 flex items-center justify-center space-x-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Confirm Delivered / Served</span>
                      </button>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {filteredOrders.filter(o => o.status === 'Ready').length === 0 && (
                <div className="col-span-full bg-neutral-900/40 border border-neutral-850 rounded-2xl p-12 text-center text-neutral-500">
                  <CheckCircle2 className="w-12 h-12 text-neutral-750 stroke-1 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-bold">No orders ready to serve.</p>
                  <p className="text-xs text-neutral-600 mt-1">Ready orders will show up here to be confirmation-dispatched by waitstaff.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Waiter Requests Alert Bar (Right Column) */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-2 flex items-center space-x-2">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>Active Waiter Requests ({filteredCalls.filter(c => c.status === 'Pending').length})</span>
            </h2>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredCalls
                  .filter(c => c.status === 'Pending')
                  .map(call => (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-neutral-900 border border-amber-500/30 rounded-xl p-4 shadow-lg flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                          <h4 className="font-extrabold text-xs text-neutral-200">
                            Table {call.tableNumber} • {call.area}
                          </h4>
                        </div>
                        <p className="text-[10px] text-neutral-400">{call.branchName}</p>
                        <p className="text-[9px] text-neutral-500">{getElapsedTime(call.createdAt)}</p>
                      </div>

                      <button
                        onClick={() => handleResolveCall(call.id)}
                        className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {filteredCalls.filter(c => c.status === 'Pending').length === 0 && (
                <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-8 text-center text-neutral-500">
                  <Bell className="w-8 h-8 text-neutral-700 stroke-1 mx-auto mb-2" />
                  <p className="text-xs font-bold">No active table assistance calls.</p>
                  <p className="text-[10px] text-neutral-600 mt-1">If a customer clicks "Call Waiter", it fires immediately here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
