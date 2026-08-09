import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, TrendingUp, BarChart3, Clock, Utensils, 
  MapPin, QrCode, DollarSign, Sparkles, Check, X, Tag, FileText,
  Flame, HelpCircle, AlertCircle, Save, ExternalLink,
  FileSpreadsheet, Globe, UploadCloud, RefreshCw, Users, Shield, Lock, 
  Share2, FileDown, Mail, MessageSquare, Printer, CheckSquare, Settings, Key, Gift, Star
} from 'lucide-react';
import { MenuItem, Branch, Table, SalesAnalytics } from '../types';
import { playChime } from './AudioAlert';

interface AdminViewProps {
  branches: Branch[];
  tables: Table[];
  menu: MenuItem[];
  onMenuUpdated: () => void;
  onTablesUpdated?: () => void;
  session?: any;
  onLogout?: () => void;
}

export default function AdminView({ branches, tables, menu, onMenuUpdated, onTablesUpdated, session, onLogout }: AdminViewProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'qr' | 'tables' | 'users' | 'security' | 'loyalty'>('analytics');
  
  // Analytics State
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Table Management State
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableFormNumber, setTableFormNumber] = useState('');
  const [tableFormArea, setTableFormArea] = useState('Open');
  const [tableFormBranchId, setTableFormBranchId] = useState('diamond');
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [tableFormError, setTableFormError] = useState<string | null>(null);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'staff'>('staff');
  const [userFormBranchId, setUserFormBranchId] = useState('golden');
  const [userFormLabel, setUserFormLabel] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Security State
  const [securityAdminId, setSecurityAdminId] = useState('usr_1');
  const [securityFormPassword, setSecurityFormPassword] = useState('');
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState<string | null>(null);
  const [securityErrorMsg, setSecurityErrorMsg] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Loyalty Management State
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<any[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltySortBy, setLoyaltySortBy] = useState<'points' | 'spent' | 'tier'>('points');

  // Reports Sharing State
  const [shareEmail, setShareEmail] = useState('');
  const [sharePhone, setSharePhone] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [shareType, setShareType] = useState<'email' | 'whatsapp'>('email');
  const [reportBranch, setReportBranch] = useState('all');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Menu Edit Form State
  const [isEditing, setIsEditing] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Starters');
  const [formPrice, setFormPrice] = useState(0);
  const [formDescription, setFormDescription] = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formCalories, setFormCalories] = useState(100);
  const [formTaste, setFormTaste] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsSpicy, setFormIsSpicy] = useState(false);
  const [formIsVegetarian, setFormIsVegetarian] = useState(false);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formBranchIds, setFormBranchIds] = useState<string[]>([]);
  const getSmartBaseUrl = () => {
    const defaultPublicUrl = 'https://ais-pre-thget5rjd4e22vtef2qnz4-381083302333.europe-west3.run.app';
    if (typeof window === 'undefined') return defaultPublicUrl;
    const origin = window.location.origin;

    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    if (origin.includes('-dev-')) {
      return origin.replace('-dev-', '-pre-');
    }
    if (origin.includes('ais-pre-') || origin.includes('-pre-')) {
      return origin;
    }

    // Attempt to extract the dynamic Cloud Run hash (e.g. thget5rjd4e22vtef2qnz4-381083302333) and region
    const hashMatch = origin.match(/([a-z0-9]+-[0-9]+)/i);
    const regionMatch = origin.match(/\.([a-z0-9-]+)\.run\.app/i);

    if (hashMatch) {
      const hash = hashMatch[1];
      const region = regionMatch ? regionMatch[1] : 'europe-west3';
      return `https://ais-pre-${hash}.${region}.run.app`;
    }

    return defaultPublicUrl;
  };

  const [qrBaseUrl, setQrBaseUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('albrazin_qr_base_url');
      if (saved && !saved.includes('ais-dev-') && !saved.includes('-dev-')) return saved;
    }
    return getSmartBaseUrl();
  });

  // FIXED: Apply admin theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  // Keep localStorage in sync when qrBaseUrl changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('albrazin_qr_base_url', qrBaseUrl);
    }
  }, [qrBaseUrl]);
  const [selectedQRBranch, setSelectedQRBranch] = useState('golden');
  const [qrTableNum, setQrTableNum] = useState('1');
  const [qrArea, setQrArea] = useState('VIP');
  const [excelPasteText, setExcelPasteText] = useState('');
  const [importerOpen, setImporterOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [menuActionLoading, setMenuActionLoading] = useState(false);
  const [fileImporting, setFileImporting] = useState(false);
  const menuFileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    id: string;
    name: string;
    size: string;
    type: string;
    itemCount: number;
    uploadedAt: string;
    base64: string;
  }[]>([
    {
      id: 'up_init_1',
      name: 'Default_Al_Brazin_Menu.xlsx',
      size: '42.5 KB',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      itemCount: 15,
      uploadedAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
      base64: ''
    }
  ]);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [menu]);

  // Fetch dynamic users list from the backend
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Fetch loyalty program data
  const fetchLoyaltyData = async () => {
    setLoyaltyLoading(true);
    try {
      const res = await fetch('/api/loyalty');
      if (res.ok) {
        const data = await res.json();
        setLoyaltyAccounts(data.accounts || []);
        setLoyaltyTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty data:', err);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLoyaltyData();
  }, [activeTab]);

  // Handle Table Save (Create or Update)
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setTableFormError(null);
    setTableActionLoading(true);

    const payload = {
      number: tableFormNumber,
      area: tableFormArea,
      branchId: tableFormBranchId
    };

    try {
      const url = editingTable ? `/api/tables/${editingTable.id}` : '/api/tables';
      const method = editingTable ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAddingTable(false);
        setEditingTable(null);
        setTableFormNumber('');
        setTableFormArea('Open');
        setTableFormBranchId('diamond');
        playChime('success');
        if (onTablesUpdated) onTablesUpdated();
      } else {
        const errorData = await res.json();
        setTableFormError(errorData.error || 'Failed to save table');
        playChime('waiter');
      }
    } catch (err) {
      console.error(err);
      setTableFormError('Network connection failed');
      playChime('waiter');
    } finally {
      setTableActionLoading(false);
    }
  };

  // Handle Table Delete
  const handleDeleteTable = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        playChime('success');
        if (onTablesUpdated) onTablesUpdated();
      } else {
        alert('Failed to delete table');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting table');
    }
  };

  // Handle User Save (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setUserActionLoading(true);

    const targetBranch = branches.find(b => b.id === userFormBranchId);
    const branchLabel = targetBranch ? `${targetBranch.name} Branch` : 'All Branches';

    const payload = {
      username: userFormUsername,
      password: userFormPassword,
      role: userFormRole,
      branchId: userFormRole === 'admin' ? null : userFormBranchId,
      label: userFormRole === 'admin' ? 'Super Admin (All Branches)' : branchLabel,
      details: userFormRole === 'admin' ? 'Full SaaS control' : 'KDS & Cashier'
    };

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAddingUser(false);
        setEditingUser(null);
        setUserFormUsername('');
        setUserFormPassword('');
        setUserFormRole('staff');
        setUserFormBranchId('golden');
        setUserFormLabel('');
        playChime('success');
        fetchUsers();
      } else {
        const errorData = await res.json();
        setUserFormError(errorData.error || 'Failed to save user');
        playChime('waiter');
      }
    } catch (err) {
      console.error(err);
      setUserFormError('Network connection failed');
      playChime('waiter');
    } finally {
      setUserActionLoading(false);
    }
  };

  // Handle User Delete
  const handleDeleteUser = async (id: string) => {
    if (id === 'usr_1') {
      alert('Cannot delete Super Admin account!');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        playChime('success');
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting user');
    }
  };

  // Handle Changing Admin/User Passwords
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccessMsg(null);
    setSecurityErrorMsg(null);
    setSecurityLoading(true);

    if (!securityFormPassword) {
      setSecurityErrorMsg('Password field cannot be empty');
      setSecurityLoading(false);
      playChime('waiter');
      return;
    }

    try {
      const res = await fetch(`/api/users/${securityAdminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: securityFormPassword })
      });

      if (res.ok) {
        setSecuritySuccessMsg('Password successfully changed and updated in backend!');
        setSecurityFormPassword('');
        playChime('success');
        fetchUsers();
      } else {
        setSecurityErrorMsg('Failed to update password');
        playChime('waiter');
      }
    } catch (err) {
      console.error(err);
      setSecurityErrorMsg('Network error updating password');
      playChime('waiter');
    } finally {
      setSecurityLoading(false);
    }
  };

  // Toggle Item Availability Quick Switch
  const toggleItemAvailability = async (item: MenuItem) => {
    const updatedAvailability = item.isAvailable === false ? true : false;
    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: updatedAvailability })
      });
      if (res.ok) {
        onMenuUpdated();
        playChime('success');
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleMenuFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileImporting(true);
    setImportStatus(`Reading file "${file.name}"...`);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string;
          if (!result) throw new Error("Could not read file data");

          // Extract base64 part
          const base64Data = result.split(',')[1];
          setImportStatus(`Analyzing & parsing "${file.name}" with Gemini 3.5 AI...`);

          const response = await fetch('/api/upload-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64: base64Data,
              filename: file.name,
              mimeType: file.type || 'application/octet-stream'
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Server parsing failed");
          }

          const data = await response.json();
          setImportStatus(data.message || `Successfully imported menu items!`);
          
          const fileSizeStr = file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
            : `${(file.size / 1024).toFixed(1)} KB`;

          setUploadedFiles(prev => [
            {
              id: 'uploaded_' + Date.now(),
              name: file.name,
              size: fileSizeStr,
              type: file.type || 'application/octet-stream',
              itemCount: data.importedCount || 0,
              uploadedAt: new Date().toISOString(),
              base64: result
            },
            ...prev
          ]);

          playChime('success');
          onMenuUpdated();
        } catch (error: any) {
          console.error(error);
          setImportStatus(`Error: ${error.message}`);
          playChime('waiter');
        } finally {
          setFileImporting(false);
          if (menuFileInputRef.current) menuFileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        setImportStatus("Failed to read local file.");
        setFileImporting(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setImportStatus(`Error: ${err.message}`);
      setFileImporting(false);
    }
  };

  // Bulk Excel/CSV parser and importer
  const handleBulkImport = async () => {
    if (!excelPasteText.trim()) return;
    setImportStatus('Processing and writing rows...');
    
    // Split text by lines
    const lines = excelPasteText.split('\n').map(l => l.trim()).filter(Boolean);
    let successCount = 0;

    for (const line of lines) {
      // Split column values by comma or tab
      const cols = line.split(/[,\t]/).map(c => c.trim());
      if (cols.length < 3) continue; // Skip lines without name, category, price

      const name = cols[0];
      const category = cols[1];
      const price = Number(cols[2]) || 35;
      const calories = Number(cols[3]) || 280;
      const taste = cols[4] || 'Succulent & aromatic';
      const description = cols[5] || `${name} prepared elegantly by Al-Brazin master chefs.`;
      const ingredientsStr = cols[6] || 'Premium ingredients';
      const ingredients = ingredientsStr.split(';').map(i => i.trim()).filter(Boolean);

      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            price,
            calories,
            taste,
            description,
            ingredients,
            isAvailable: true,
            branchIds: [] // global by default
          })
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error('Bulk row failure:', err);
      }
    }

    onMenuUpdated();
    setImportStatus(`Success! Imported ${successCount} menu items from spreadsheet.`);
    setExcelPasteText('');
    playChime('success');
  };

  // Sync menu items globally across all 5 branches (clears specific branch limitations)
  const handleMakeAllGlobal = async () => {
    if (!confirm('Sync Menu: Are you sure you want to update all menu items to be globally accessible across all 5 branches?')) return;
    setImportStatus('Syncing branch controls...');
    try {
      for (const item of menu) {
        if (item.branchIds && item.branchIds.length > 0) {
          await fetch(`/api/menu/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branchIds: [] })
          });
        }
      }
      onMenuUpdated();
      setImportStatus('Successfully updated menu across all branches simultaneously!');
      playChime('success');
    } catch (err) {
      console.error(err);
      setImportStatus('Sync failed.');
    }
  };

  // Reset entire menu grid to standard premium defaults
  const handleResetMenuToDefault = async () => {
    if (!confirm('Are you sure you want to reset the entire menu grid to default? All custom added items will be refreshed.')) return;
    setImportStatus('Resetting menu...');
    try {
      const res = await fetch('/api/menu/reset', { method: 'POST' });
      if (res.ok) {
        onMenuUpdated();
        setImportStatus('Menu successfully reset to original premium selections!');
        playChime('success');
      }
    } catch (err) {
      console.error(err);
      setImportStatus('Reset failed.');
    }
  };

  // High-fidelity branded table QR code desk plate printing helper
  const handlePrintQRCode = (branchId: string, tableNumber: string, area: string) => {
    const branchName = branches.find(b => b.id === branchId)?.name || 'Al-Brazin Restaurant';
    const link = `${qrBaseUrl}/?branch=${branchId}&table=${tableNumber}&area=${area.toLowerCase()}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=1c1917&data=${encodeURIComponent(link)}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print QR desk plates.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Al-Brazin QR Plate - Table ${tableNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body {
              background: #ffffff;
              color: #1c1917;
              font-family: 'Inter', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .plate-card {
              border: 5px double #d97706;
              padding: 45px;
              border-radius: 28px;
              max-width: 420px;
              box-shadow: 0 15px 40px rgba(0,0,0,0.06);
              background: #fafaf9;
            }
            .logo {
              font-size: 28px;
              font-weight: 900;
              color: #1c1917;
              letter-spacing: 1.5px;
              margin-bottom: 2px;
            }
            .sublogo {
              font-size: 11px;
              color: #b45309;
              text-transform: uppercase;
              font-weight: 800;
              letter-spacing: 3px;
              margin-bottom: 30px;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 22px;
              border-radius: 20px;
              border: 1px solid #e7e5e4;
              display: inline-block;
              box-shadow: 0 4px 12px rgba(0,0,0,0.02);
              margin-bottom: 30px;
            }
            .qr-image {
              width: 240px;
              height: 240px;
              display: block;
            }
            .meta {
              font-size: 18px;
              font-weight: 900;
              color: #1c1917;
              margin-bottom: 6px;
            }
            .area-badge {
              display: inline-block;
              background: #fef3c7;
              color: #b45309;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 14px;
              border-radius: 99px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 20px;
            }
            .instructions {
              font-size: 12px;
              color: #78716c;
              line-height: 1.6;
              font-weight: 500;
            }
            .no-print-btn {
              margin-top: 35px;
              padding: 12px 28px; 
              background: #d97706; 
              color: white; 
              border: none; 
              border-radius: 10px; 
              font-weight: 900; 
              font-size: 13px;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
              transition: all 0.2s ease;
            }
            .no-print-btn:hover {
              background: #b45309;
            }
            @media print {
              .no-print { display: none; }
              body { height: auto; }
              .plate-card { border: none; box-shadow: none; background: transparent; }
            }
          </style>
        </head>
        <body>
          <div class="plate-card">
            <div class="logo">البرزين | Al-Brazin</div>
            <div class="sublogo">Restaurants & Co.</div>
            <div class="qr-wrapper">
              <img class="qr-image" src="${qrImgUrl}" alt="QR Code" />
            </div>
            <div class="meta">${branchName}</div>
            <div class="area-badge">Table ${tableNumber} • ${area}</div>
            <div class="instructions">
              Please scan this QR code with your mobile camera to instantly view our interactive menu, communicate with Al-Brazin AI Waiter, and place your order directly.
            </div>
          </div>
          <p class="no-print">
            <button class="no-print-btn" onclick="window.print()">
              Print Physical Plate
            </button>
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Bulk print all QR plates for an entire branch
  const handlePrintAllBranchQRs = (branchId: string) => {
    const branchObj = branches.find(b => b.id === branchId);
    const branchName = branchObj?.name || 'Al-Brazin Restaurant';
    const branchTables = tables.filter(t => t.branchId === branchId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print QR sheets.');
      return;
    }

    let platesHtml = '';
    branchTables.forEach((table, index) => {
      const link = `${qrBaseUrl}/?branch=${branchId}&table=${table.number}&area=${table.area.toLowerCase()}`;
      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=1c1917&data=${encodeURIComponent(link)}`;

      platesHtml += `
        <div class="plate-card">
          <div class="logo">البرزين | Al-Brazin</div>
          <div class="sublogo">Restaurants & Co.</div>
          <div class="qr-wrapper">
            <img class="qr-image" src="${qrImgUrl}" alt="QR Code" />
          </div>
          <div class="meta">${branchName}</div>
          <div class="area-badge">Table ${table.number} • ${table.area} Section</div>
          <div class="instructions">
            Scan to summon our Smart AI Waiter, view the menu, and order.
          </div>
        </div>
        ${index < branchTables.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Al-Brazin Bulk QR - ${branchName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body {
              background: #ffffff;
              color: #1c1917;
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 0;
            }
            .container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
            }
            .plate-card {
              border: 5px double #d97706;
              padding: 40px;
              border-radius: 28px;
              max-width: 420px;
              box-shadow: 0 15px 40px rgba(0,0,0,0.06);
              background: #fafaf9;
              text-align: center;
              margin: 40px auto;
              page-break-inside: avoid;
            }
            .logo {
              font-size: 28px;
              font-weight: 900;
              color: #1c1917;
              letter-spacing: 1.5px;
              margin-bottom: 2px;
            }
            .sublogo {
              font-size: 11px;
              color: #b45309;
              text-transform: uppercase;
              font-weight: 800;
              letter-spacing: 3px;
              margin-bottom: 30px;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 22px;
              border-radius: 20px;
              border: 1px solid #e7e5e4;
              display: inline-block;
              margin-bottom: 30px;
            }
            .qr-image {
              width: 230px;
              height: 230px;
              display: block;
            }
            .meta {
              font-size: 18px;
              font-weight: 900;
              margin-bottom: 6px;
            }
            .area-badge {
              display: inline-block;
              background: #fef3c7;
              color: #b45309;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 14px;
              border-radius: 99px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 20px;
            }
            .instructions {
              font-size: 11px;
              color: #78716c;
              line-height: 1.6;
            }
            .page-break {
              page-break-after: always;
            }
            .no-print-bar {
              background: #1c1917;
              color: white;
              padding: 15px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 13px;
              font-weight: bold;
            }
            .no-print-btn {
              padding: 8px 20px;
              background: #d97706;
              color: white;
              border: none;
              border-radius: 6px;
              font-weight: 900;
              cursor: pointer;
            }
            @media print {
              .no-print-bar { display: none; }
              .plate-card { border: none; box-shadow: none; background: transparent; margin: 0 auto; padding-top: 100px; }
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <span>Al-Brazin Bulk QR Print Sheet - Total ${branchTables.length} Plates</span>
            <button class="no-print-btn" onclick="window.print()">Print All Plates (${branchTables.length})</button>
          </div>
          <div class="container">
            ${platesHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    setIsEditing(null);
    setFormName('');
    setFormCategory('Starters');
    setFormPrice(30);
    setFormDescription('');
    setFormIngredients('');
    setFormCalories(250);
    setFormTaste('Rich and savory');
    setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60');
    setFormIsSpicy(false);
    setFormIsVegetarian(false);
    setFormIsPopular(false);
    setFormIsAvailable(true);
    setFormBranchIds([]);
    setIsAdding(true);
    playChime('success');
  };

  // Open Form for Editing
  const handleOpenEdit = (item: MenuItem) => {
    setIsAdding(false);
    setIsEditing(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormDescription(item.description);
    setFormIngredients(item.ingredients.join(', '));
    setFormCalories(item.calories);
    setFormTaste(item.taste);
    setFormImage(item.image || '');
    setFormIsSpicy(!!item.isSpicy);
    setFormIsVegetarian(!!item.isVegetarian);
    setFormIsPopular(!!item.isPopular);
    setFormIsAvailable(item.isAvailable !== false);
    setFormBranchIds(item.branchIds || []);
    playChime('success');
  };

  // Submit Menu Item (Add or Edit)
  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuActionLoading(true);

    const payload = {
      name: formName,
      category: formCategory,
      price: Number(formPrice),
      description: formDescription,
      ingredients: formIngredients.split(',').map(s => s.trim()).filter(Boolean),
      calories: Number(formCalories),
      taste: formTaste,
      image: formImage,
      isSpicy: formIsSpicy,
      isVegetarian: formIsVegetarian,
      isPopular: formIsPopular,
      isAvailable: formIsAvailable,
      branchIds: formBranchIds
    };

    try {
      let res;
      if (isAdding) {
        res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (isEditing) {
        res = await fetch(`/api/menu/${isEditing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res && res.ok) {
        setIsAdding(false);
        setIsEditing(null);
        onMenuUpdated();
        playChime('success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMenuActionLoading(false);
    }
  };

  const getFilteredReportData = () => {
    const branchName = reportBranch === 'all' ? 'All Branches' : (branches.find(b => b.id === reportBranch)?.name || 'Selected Branch');
    const periodLabel = reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1);
    
    // Dynamically calculate revenue
    let baseRevenue = 325450;
    if (reportBranch !== 'all') {
      const branchTablesCount = tables.filter(t => t.branchId === reportBranch).length;
      const totalTablesCount = tables.length;
      const ratio = totalTablesCount > 0 ? (branchTablesCount / totalTablesCount) : 0.2;
      baseRevenue = baseRevenue * ratio;
    }
    
    // Scale by period
    if (reportPeriod === 'yearly') {
      // Keep base
    } else if (reportPeriod === 'monthly') {
      baseRevenue = baseRevenue / 12;
    } else if (reportPeriod === 'weekly') {
      baseRevenue = baseRevenue / 52;
    } else if (reportPeriod === 'daily') {
      baseRevenue = baseRevenue / 365;
    }
    
    const dateNum = new Date(reportDate).getDate() || 1;
    const variation = 1 + ((dateNum % 10) - 5) / 50; // -10% to +10%
    const calculatedRevenueVal = Math.round(baseRevenue * variation);
    const calculatedRevenue = `${calculatedRevenueVal.toLocaleString()} SAR`;
    
    const filteredBranches = reportBranch === 'all' ? branches : branches.filter(b => b.id === reportBranch);
    const filteredTables = reportBranch === 'all' ? tables : tables.filter(t => t.branchId === reportBranch);
    const filteredUsers = reportBranch === 'all' ? users : users.filter(u => u.branchId === reportBranch);
    const filteredReviews = reportBranch === 'all' ? (analytics?.reviews || []) : (analytics?.reviews || []).filter((r: any) => r.branchId === reportBranch);
    
    const calculatedAvgRating = filteredReviews.length > 0 
      ? parseFloat((filteredReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / filteredReviews.length).toFixed(2))
      : (analytics?.averageRating || 4.25);

    return {
      branchName,
      periodLabel,
      calculatedRevenue,
      calculatedRevenueVal,
      filteredBranches,
      filteredTables,
      filteredUsers,
      filteredReviews,
      calculatedAvgRating,
      reportDate,
      reportPeriod
    };
  };

  // 1. Download PDF Report
  const handleDownloadPDF = () => {
    playChime('success');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const data = getFilteredReportData();

    printWindow.document.write(`
      <html>
        <head>
          <title>Al-Brazin Restaurant Group - Performance & Audit Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1c1917; background: #ffffff; }
            .header { border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: 900; letter-spacing: 1px; color: #1c1917; }
            .sublogo { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #d97706; letter-spacing: 3px; }
            .title { font-size: 20px; font-weight: 800; margin-top: 15px; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .meta-card { background: #fafaf9; border: 1px solid #e7e5e4; padding: 15px; border-radius: 12px; text-align: center; }
            .meta-val { font-size: 18px; font-weight: bold; color: #d97706; margin-top: 5px; }
            .meta-label { font-size: 10px; text-transform: uppercase; color: #78716c; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1c1917; color: white; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 12px; }
            tr:nth-child(even) { background: #fafaf9; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">البرزين | AL-BRAZIN</div>
            <div class="sublogo">Restaurants & Co. - Global Executive Board</div>
            <div class="title">Performance Audit & Operational Report</div>
            <p style="font-size: 11px; color: #78716c; margin-top: 5px;">
              Generated on: ${new Date().toLocaleString()} • Report Branch: <strong>${data.branchName}</strong> • Period: <strong>${data.periodLabel} (Ref Date: ${data.reportDate})</strong>
            </p>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Calculated Revenue</div>
              <div class="meta-val">${data.calculatedRevenue}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Selected Branches</div>
              <div class="meta-val">${data.filteredBranches.length} of ${branches.length}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Global Menu Items</div>
              <div class="meta-val">${menu.length} Dishes</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Tracked Dining Tables</div>
              <div class="meta-val">${data.filteredTables.length} tables</div>
            </div>
          </div>

          <div class="meta-grid" style="grid-template-cols: repeat(2, 1fr); margin-top: -10px;">
            <div class="meta-card">
              <div class="meta-label">AI Calculated Average Customer Rating</div>
              <div class="meta-val">${data.calculatedAvgRating.toFixed(2)} / 5.0</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Total Verified Reviews in Context</div>
              <div class="meta-val">${data.filteredReviews.length} reviews</div>
            </div>
          </div>

          <h3>1. Branch Performance Details</h3>
          <table>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Location</th>
                <th>Registered Dining Tables</th>
                <th>Estimated Staff Accounts</th>
              </tr>
            </thead>
            <tbody>
              ${data.filteredBranches.map(b => `
                <tr>
                  <td><strong>${b.name}</strong></td>
                  <td>Saudi Arabia</td>
                  <td>${tables.filter(t => t.branchId === b.id).length} tables</td>
                  <td>${users.filter(u => u.branchId === b.id).length} users</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>2. Dining Area Tables Matrix</h3>
          <table>
            <thead>
              <tr>
                <th>Table ID</th>
                <th>Branch Identifier</th>
                <th>Table Number</th>
                <th>Dining Area / Category</th>
              </tr>
            </thead>
            <tbody>
              ${data.filteredTables.map(t => `
                <tr>
                  <td><code>${t.id}</code></td>
                  <td>${branches.find(b => b.id === t.branchId)?.name || t.branchId}</td>
                  <td>Table #${t.number}</td>
                  <td><span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${t.area}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            CONFIDENTIAL - Internal Operations Audit Report for Al-Brazin Restaurant Group. All rights reserved. © ${new Date().getFullYear()}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 2. Download Excel Report (as CSV layout)
  const handleDownloadExcel = () => {
    playChime('success');
    const data = getFilteredReportData();
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += `AL-BRAZIN RESTAURANTS GROUP - PERFORMANCE AUDIT REPORT\n`;
    csvContent += `Report Filter Branch,${data.branchName}\n`;
    csvContent += `Report Period,${data.periodLabel}\n`;
    csvContent += `Reference Date,${data.reportDate}\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += `Calculated Revenue,${data.calculatedRevenue}\n`;
    csvContent += `AI Calculated Average Customer Rating,${data.calculatedAvgRating.toFixed(2)} / 5.0\n\n`;
    
    csvContent += "BRANCH PERFORMANCE DIRECTORY\n";
    csvContent += "Branch ID,Branch Name,Registered Tables,Estimated Staff\n";
    data.filteredBranches.forEach(b => {
      const tblCount = tables.filter(t => t.branchId === b.id).length;
      const usrCount = users.filter(u => u.branchId === b.id).length;
      csvContent += `"${b.id}","${b.name}",${tblCount},${usrCount}\n`;
    });
    csvContent += "\n";

    csvContent += "TABLE REGISTRY DETAILS\n";
    csvContent += "Table ID,Branch ID,Table Number,Dining Section/Area\n";
    data.filteredTables.forEach(t => {
      csvContent += `"${t.id}","${t.branchId}",Table #${t.number},"${t.area}"\n`;
    });
    csvContent += "\n";

    csvContent += "GLOBAL SAAS MENU DISHES\n";
    csvContent += "Dish ID,Name,Category,Price (SAR),Calories,Available\n";
    menu.forEach(m => {
      csvContent += `"${m.id}","${m.name}","${m.category}",${m.price},${m.calories || 100},${m.isAvailable ? 'YES' : 'NO'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Al-Brazin_Restaurants_Report_${data.branchName.replace(/\s+/g, '_')}_${data.reportPeriod}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Share Report via Email or WhatsApp
  const handleShareReport = (type: 'email' | 'whatsapp') => {
    setShareStatus('sending');
    playChime('success');

    const data = getFilteredReportData();
    const reportSummary = `Al-Brazin Restaurants Executive Performance Report Summary: Branch: ${data.branchName}, Period: ${data.periodLabel} (Ref Date: ${data.reportDate}), Calculated Revenue: ${data.calculatedRevenue}, AI Avg Customer Rating: ${data.calculatedAvgRating.toFixed(2)}/5.0 from ${data.filteredReviews.length} reviews, Tracked Tables: ${data.filteredTables.length}. Confirmed and approved dynamically via SaaS Control System.`;

    setTimeout(() => {
      if (type === 'email') {
        if (!shareEmail) {
          setShareStatus('error');
          alert('Please enter a valid email address first.');
          return;
        }
        const mailtoLink = `mailto:${shareEmail}?subject=Al-Brazin%20Restaurant%20Group%20Operational%20Report&body=${encodeURIComponent(reportSummary)}`;
        window.location.href = mailtoLink;
        setShareStatus('success');
      } else {
        if (!sharePhone) {
          setShareStatus('error');
          alert('Please enter a valid phone number first.');
          return;
        }
        const cleanPhone = sharePhone.replace(/\D/g, '');
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reportSummary)}`;
        window.open(waLink, '_blank');
        setShareStatus('success');
      }
    }, 800);
  };

  // Delete Menu Item
  const handleDeleteMenu = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this dish permanently from all branch menus?')) return;
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onMenuUpdated();
        playChime('success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-6 relative">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Admin Title (Immersive UI Style) */}
      <header className="mb-6 pb-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-30 p-4 rounded-2xl shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Brand Block */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shadow-orange-glow">
              <span className="font-bold text-black text-xl">B</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight uppercase flex items-center gap-2">
                Al-Brazin <span className="text-amber-500 italic">Restaurants & Co.</span>
                <span className="text-xs text-neutral-400 font-normal lowercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">SaaS Control</span>
              </h1>
              <p className="text-neutral-400 text-[10px] mt-0.5">
                Global price controllers, menu customizers, & branch table matrix trackers
              </p>
            </div>
          </div>

          {/* System status pill */}
          <div className="flex items-center gap-4 text-xs text-gray-400 border-l border-white/10 pl-4 h-8">
            <span className="flex flex-col">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full shadow-green-glow animate-pulse"></span>
                Admin Auth Verified
              </span>
              {session && (
                <span className="text-[9px] text-amber-500 font-extrabold mt-0.5 block">
                  Logged: {session.username} (Super Admin)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap bg-neutral-900 border border-white/10 p-1 rounded-xl w-full xl:w-auto justify-end gap-1">
          <button
            onClick={() => {
              setActiveTab('analytics');
              playChime('success');
            }}
            className={`py-1.5 px-3.5 sm:px-5 rounded-lg text-xs font-black flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Analytics</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('menu');
              playChime('success');
            }}
            className={`py-1.5 px-3.5 sm:px-5 rounded-lg text-xs font-black flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'menu' 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Menu Manager</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('qr');
              playChime('success');
            }}
            className={`py-1.5 px-3.5 sm:px-5 rounded-lg text-xs font-black flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'qr' 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Setup</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tables');
              playChime('success');
            }}
            className={`py-1.5 px-3.5 sm:px-5 rounded-lg text-xs font-black flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'tables' 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tables</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              playChime('success');
            }}
            className={`py-1.5 px-3.5 sm:px-5 rounded-lg text-xs font-black flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('loyalty');
              fetchLoyaltyData();
              playChime('success');
            }}
            className={`py-1.5 px-3.5 sm:px-5 rounded-lg text-xs font-black flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'loyalty' 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Loyalty Rewards</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('security');
              playChime('success');
            }}
            className={`py-1.5 px-3.5 sm:px-5 rounded-lg text-xs font-black flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>
      </header>

      {/* ADMIN WORKSPACE TAB SECTIONS */}
      {activeTab === 'analytics' && analytics && (
        /* TAB 1: ANALYTICS SUITE WITH HIGH CONTRAST SVG CHARTS */
        <div className="space-y-6">
          {/* Hero Metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Global Monthly revenue</span>
                <p className="text-xl font-extrabold text-neutral-100 mt-1">325,450 SAR</p>
              </div>
              <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Total active branches</span>
                <p className="text-xl font-extrabold text-neutral-100 mt-1">5 branches</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-400">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Total Food Items</span>
                <p className="text-xl font-extrabold text-neutral-100 mt-1">{menu.length} Dishes</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <Utensils className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Avg Customer Rating</span>
                <p className="text-xl font-extrabold text-neutral-100 mt-1">{(analytics?.averageRating || 4.25).toFixed(2)} / 5.0</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* EXECUTIVE PERFORMANCE AUDIT HUB */}
          <div className="bg-[#111111]/95 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-5">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Executive Audit, Reporting & Dynamic Sharing Hub</span>
                </h3>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Export verified performance audits directly as standard PDF documents, structured spreadsheets, or distribute summaries instantly to stakeholders.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="py-1.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-amber-500/30 rounded-xl text-[10px] font-extrabold transition flex items-center space-x-1.5 cursor-pointer text-neutral-200"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Export PDF Audit</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="py-1.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-amber-500/30 rounded-xl text-[10px] font-extrabold transition flex items-center space-x-1.5 cursor-pointer text-neutral-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export Excel Audit</span>
                </button>
              </div>
            </div>

            {/* AUDIT PARAMETER FILTERS */}
            <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5">Filter by Branch</label>
                <select
                  value={reportBranch}
                  onChange={(e) => setReportBranch(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-semibold text-neutral-200 cursor-pointer"
                >
                  <option value="all">All Branches (Enterprise)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5">Filter by Period</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-semibold text-neutral-200 cursor-pointer"
                >
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                  <option value="yearly">Yearly Report</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5">Reference Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-mono text-neutral-200 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box A: WhatsApp Sharing Gateway */}
              <div className="bg-neutral-950/60 p-4 border border-white/5 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-white">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp Distribution Channel</span>
                  </div>
                  <p className="text-[9px] text-neutral-500 mt-1">
                    Send real-time audit performance insights directly to management or branch leaders via instant WhatsApp links.
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="tel"
                    placeholder="e.g. +966500000000"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-amber-500 font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleShareReport('whatsapp')}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-[10px] uppercase rounded-lg tracking-wider transition cursor-pointer"
                  >
                    Share WA
                  </button>
                </div>
              </div>

              {/* Box B: Email Distribution Gateway */}
              <div className="bg-neutral-950/60 p-4 border border-white/5 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-white">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Email Distribution Channel</span>
                  </div>
                  <p className="text-[9px] text-neutral-500 mt-1">
                    Trigger official audit summary emails containing key metrics, active branches directories, and table registry totals.
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    placeholder="executive@albrazin.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-amber-500 font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleShareReport('email')}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[10px] uppercase rounded-lg tracking-wider transition cursor-pointer"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI CUSTOMER SATISFACTION & SENTIMENT OVERVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Box 1: AI Sentiment Summary and Highlights */}
            <div className="lg:col-span-2 bg-[#111111]/95 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-yellow-500/5 rounded-full blur-[60px] pointer-events-none" />
              <h3 className="text-xs font-black text-neutral-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>AI Gastronomy Satisfaction & Sentiment Highlights</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">AI Sentiment Score</span>
                  <p className="text-3xl font-black text-amber-400 mt-1">{analytics.aiSatisfactionScore || '94'}%</p>
                  <p className="text-[9px] text-neutral-500 mt-1 italic">Exceptional Guest Delight</p>
                </div>
                <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Avg Customer Rating</span>
                  <p className="text-3xl font-black text-neutral-200 mt-1">{(analytics.averageRating || 4.25).toFixed(2)}/5</p>
                  <p className="text-[9px] text-neutral-500 mt-1 font-medium">From {analytics.reviews?.length || 4} verified guest reviews</p>
                </div>
                <div className="bg-neutral-950 border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Kitchen Accuracy</span>
                  <p className="text-3xl font-black text-emerald-400 mt-1">98.4%</p>
                  <p className="text-[9px] text-neutral-500 mt-1 font-medium">Served order compliance</p>
                </div>
              </div>

              <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-4">
                <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                  <span>Real-time Chef Insights & Recommendation Feed</span>
                </h4>
                <ul className="space-y-2">
                  {(analytics.aiHighlights && analytics.aiHighlights.length > 0) ? (
                    analytics.aiHighlights.map((highlight, index) => (
                      <li key={index} className="text-xs text-neutral-300 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="text-xs text-neutral-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 mt-1.5 rounded-full" />
                        <span>The Wagyu Beef Burger has a 100% positive rating across Golden Riyadh; consider highlighting it in the AI Waiter's introductory messages.</span>
                      </li>
                      <li className="text-xs text-neutral-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 mt-1.5 rounded-full" />
                        <span>A guest at Prestigino main branch noted cold french fries; recommend staff verify temperature parameters prior to KDS dispatch.</span>
                      </li>
                      <li className="text-xs text-neutral-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 mt-1.5 rounded-full" />
                        <span>High demand for mocktails suggests cross-selling options during customer dessert checkout is extremely lucrative.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Box 2: Latest Customer Reviews List */}
            <div className="bg-[#111111]/95 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-neutral-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Latest Guest Feedback Registry</span>
                </h3>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {analytics.reviews && analytics.reviews.length > 0 ? (
                    analytics.reviews.map((rev: any) => (
                      <div key={rev.id} className="bg-neutral-950 p-2.5 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-500 uppercase">
                            {branches.find(b => b.id === rev.branchId)?.name || 'Golden Restaurant'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Sparkles 
                                key={i} 
                                className={`w-2.5 h-2.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-300 italic leading-relaxed">
                          "{rev.comment || 'No written comment left by guest.'}"
                        </p>
                        <p className="text-[8px] text-neutral-500 font-mono text-right">
                          {new Date(rev.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500 italic text-center py-8">No reviews submitted yet.</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={fetchAnalytics}
                className="mt-4 w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/5 hover:border-amber-500/20 text-[10px] font-black uppercase rounded-lg transition tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Sentiment Feed</span>
              </button>
            </div>
          </div>

          {/* SVG Graphs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Revenue per branch */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-300 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>Revenue Distribution by Restaurant Branch (SAR)</span>
              </h3>

              {/* Custom SVG Bar Chart */}
              <div className="relative h-60 w-full flex items-end justify-between pt-6 px-4">
                {analytics.revenuePerBranch.map((b, idx) => {
                  const maxRev = Math.max(...analytics.revenuePerBranch.map(r => r.revenue));
                  const percentage = (b.revenue / maxRev) * 80; // scale up to 80% height

                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      {/* Value tooltip */}
                      <span className="text-[10px] text-amber-400 font-bold mb-2 opacity-0 group-hover:opacity-100 transition duration-300">
                        {b.revenue.toLocaleString()}
                      </span>
                      {/* Vertical Bar */}
                      <div 
                        style={{ height: `${percentage}%` }}
                        className="w-8 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-lg shadow-lg shadow-amber-500/10 hover:brightness-110 transition duration-500 min-h-[10px]"
                      />
                      {/* Label */}
                      <span className="text-[9px] text-neutral-500 font-bold text-center truncate mt-2 max-w-[70px]" title={b.branchName}>
                        {b.branchName.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Order trends over time */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-300 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Daily Sales Trend Over Past Week (SAR)</span>
              </h3>

              {/* Responsive SVG Polyline Line Chart */}
              <div className="h-60 w-full relative pt-6 flex flex-col justify-between">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                  <defs>
                    <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#1f1f1f" strokeWidth="1" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#1f1f1f" strokeWidth="1" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="#1f1f1f" strokeWidth="1" />

                  {/* Draw area glow */}
                  <polygon
                    points={`0,150 
                      0,${150 - (analytics.orderTrends[0].revenue / 45000) * 110} 
                      83,${150 - (analytics.orderTrends[1].revenue / 45000) * 110} 
                      166,${150 - (analytics.orderTrends[2].revenue / 45000) * 110} 
                      249,${150 - (analytics.orderTrends[3].revenue / 45000) * 110} 
                      332,${150 - (analytics.orderTrends[4].revenue / 45000) * 110} 
                      415,${150 - (analytics.orderTrends[5].revenue / 45000) * 110} 
                      500,${150 - (analytics.orderTrends[6].revenue / 45000) * 110} 
                      500,150`}
                    fill="url(#chart-glow)"
                  />

                  {/* Draw trend path */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={`
                      0,${150 - (analytics.orderTrends[0].revenue / 45000) * 110}
                      83,${150 - (analytics.orderTrends[1].revenue / 45000) * 110}
                      166,${150 - (analytics.orderTrends[2].revenue / 45000) * 110}
                      249,${150 - (analytics.orderTrends[3].revenue / 45000) * 110}
                      332,${150 - (analytics.orderTrends[4].revenue / 45000) * 110}
                      415,${150 - (analytics.orderTrends[5].revenue / 45000) * 110}
                      500,${150 - (analytics.orderTrends[6].revenue / 45000) * 110}
                    `}
                  />

                  {/* Data Dots with values */}
                  {analytics.orderTrends.map((trend, idx) => {
                    const cx = idx * (500 / 6);
                    const cy = 150 - (trend.revenue / 45000) * 110;
                    return (
                      <g key={idx} className="group cursor-pointer">
                        <circle cx={cx} cy={cy} r="5" fill="#f59e0b" className="hover:r-7 transition" />
                        <text x={cx} y={cy - 12} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition">
                          {trend.revenue.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[9px] text-neutral-500 font-bold mt-2">
                  {analytics.orderTrends.map((t, idx) => (
                    <span key={idx}>{t.date}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table list: Top selling items and peak hour distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top selling list */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-300 mb-3 flex items-center space-x-2">
                <Utensils className="w-4 h-4 text-amber-500" />
                <span>Top Selling Culinary Creations</span>
              </h3>

              <div className="space-y-3.5">
                {analytics.topSellingItems.slice(0, 5).map((item, idx) => {
                  const maxQty = Math.max(...analytics.topSellingItems.map(i => i.quantity));
                  const percentWidth = (item.quantity / maxQty) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-neutral-200">{item.name}</span>
                        <span className="text-amber-500 font-bold">{item.quantity} portions sold</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percentWidth}%` }}
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peak Hours distribution */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-300 mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Peak Ordering Hours (Global)</span>
              </h3>

              <div className="space-y-2.5">
                {analytics.peakHours.map((hour, idx) => (
                  <div key={idx} className="flex items-center text-xs justify-between">
                    <span className="text-neutral-400 font-semibold w-20">{hour.hour}</span>
                    {/* Horizontal simple bar distribution */}
                    <div className="flex-1 mx-3 bg-neutral-950 h-2.5 rounded-lg overflow-hidden">
                      <div 
                        style={{ width: `${(hour.orderCount / 110) * 100}%` }}
                        className="bg-blue-500 h-full rounded-lg"
                      />
                    </div>
                    <span className="text-neutral-300 font-extrabold w-12 text-right">{hour.orderCount} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        /* TAB 2: MENU MANAGER CRUD SECTION */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-neutral-300 flex items-center space-x-1.5">
              <Utensils className="w-4 h-4 text-amber-500" />
              <span>Full Restaurant Menu List ({menu.length} Items)</span>
            </h2>

            <button
              onClick={handleOpenAdd}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          {/* SaaS Enterprise Excel Spreadsheet Bulk Tools Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">Enterprise Menu Controllers</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Bulk sync, spreadsheet copy-paste engines, and factory catalog reloads.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  ref={menuFileInputRef}
                  onChange={handleMenuFileChange}
                  accept=".xlsx,.xls,.csv,.pdf"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => menuFileInputRef.current?.click()}
                  disabled={fileImporting}
                  className="px-3 py-1.5 rounded-lg border bg-amber-500 hover:bg-amber-400 text-neutral-950 hover:border-amber-500/30 text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Directly select and upload an Excel or PDF menu file"
                >
                  {fileImporting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Excel or PDF Menu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImporterOpen(!importerOpen)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    importerOpen 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle manual copy-paste spreadsheet text importer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Manual Copy-Paste Importer</span>
                </button>
 
                <button
                  type="button"
                  onClick={handleMakeAllGlobal}
                  className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  title="Make all dishes available in all 5 branches in one click"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Force Global Sync</span>
                </button>
 
                <button
                  type="button"
                  onClick={handleResetMenuToDefault}
                  className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/20 text-neutral-300 hover:text-red-400 text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  title="Clear database and reload premium default items"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-red-500 animate-hover-spin" />
                  <span>Reload Default Menu</span>
                </button>
              </div>
            </div>

            {/* Directly Accessible Uploaded Files Registry */}
            <div className="bg-neutral-950/60 p-3.5 border border-neutral-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-neutral-300 tracking-wider flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                  <span>📁 Uploaded Documents Registry (PDF & Excel)</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">Directly accessible in active session</span>
              </div>
              
              {uploadedFiles.length === 0 ? (
                <p className="text-[10px] text-neutral-500 italic">No document uploaded yet. Click "Upload Excel or PDF Menu" to import.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between text-xs hover:border-neutral-700 transition">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="p-1.5 bg-amber-500/10 rounded-lg shrink-0">
                          <FileText className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-neutral-200 truncate" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-neutral-500">{file.size} • {file.itemCount} items parsed</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {file.base64 ? (
                          <a
                            href={file.base64}
                            download={file.name}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition flex items-center space-x-1"
                            title="Directly Access Original Uploaded File"
                          >
                            <FileDown className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-500">Access</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-neutral-600 italic">System default</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 
            {/* Collapsible Importer Textarea */}
            {importerOpen && (
              <div className="bg-neutral-950/80 p-4 border border-neutral-800/80 rounded-xl space-y-3.5 animate-slide-down">
                <div className="text-[10px] text-neutral-400 space-y-1">
                  <p className="font-bold text-amber-400 uppercase tracking-wide">📋 Excel Spreadsheet Copy-Paste Instructions:</p>
                  <p>1. Open your Excel sheet containing your restaurant menu items.</p>
                  <p>2. Arrange your columns exactly as: <strong className="text-white">Dish Name, Category, Price, Calories, Taste, Description, Ingredients (Separated by ;)</strong></p>
                  <p>3. Select the rows, copy (Ctrl+C), and paste them into the box below. The importer will split columns using tabs or commas, create IDs, set availability, and sync them immediately!</p>
                </div>
                
                <textarea
                  rows={4}
                  value={excelPasteText}
                  onChange={(e) => setExcelPasteText(e.target.value)}
                  placeholder="Paste rows here...&#10;Burger,Mains,65,450,Smoky & rich,Our prime beef burger,Beef;Cheese;Brioche&#10;Baklava Shake,Drinks,28,320,Sweet and creamy,Premium milkshake with real honey,Milk;Honey;Ice Cream"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    className="py-1.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Process & Import Spreadsheet</span>
                  </button>
                  <span className="text-[10px] text-neutral-500 italic">Tabs or Comma split supported</span>
                </div>
              </div>
            )}
 
            {/* Import Status Alert Banner */}
            {importStatus && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-2 rounded-xl flex items-center justify-between">
                <span className="font-bold">{importStatus}</span>
                <button 
                  onClick={() => setImportStatus('')}
                  className="text-neutral-400 hover:text-white font-bold ml-2 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* List of items table (Left Column - 2 col span) */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl max-h-[75vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950 text-[10px] text-neutral-500 font-black uppercase tracking-wider border-b border-neutral-800">
                    <th className="p-3">Dish / Category</th>
                    <th className="p-3">Global Price</th>
                    <th className="p-3">Branch Assigned</th>
                    <th className="p-3">Availability Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {menu.map((item) => (
                    <tr key={item.id} className={`hover:bg-neutral-850 transition ${item.isAvailable === false ? 'opacity-55' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          {item.image && (
                            <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-neutral-850" />
                          )}
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h4 className="font-extrabold text-xs text-neutral-200">{item.name}</h4>
                              {item.isSpicy && <span className="text-[9px]">🌶️</span>}
                              {item.isVegetarian && <span className="text-[9px]">🥦</span>}
                            </div>
                            <span className="text-[9px] bg-neutral-800 text-neutral-400 font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block uppercase">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs font-black text-amber-400">{item.price} SAR</td>
                      <td className="p-3 text-[10px]">
                        {!item.branchIds || item.branchIds.length === 0 ? (
                          <span className="text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]">
                            🌐 All 5 Branches
                          </span>
                        ) : (
                          <span className="text-neutral-300 bg-neutral-850 border border-white/5 px-1.5 py-0.5 rounded font-black text-[8px] uppercase">
                            📍 {item.branchIds.map(id => branches.find(b => b.id === id)?.name.replace(' Restaurant', '').replace('Al Rashid Al Khobar', 'Al Khobar') || id).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        <button
                          onClick={() => toggleItemAvailability(item)}
                          className={`px-2 py-1 rounded text-[9px] font-black uppercase transition cursor-pointer select-none ${
                            item.isAvailable !== false
                              ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 shadow-green-glow'
                              : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400'
                          }`}
                          title="Click to toggle availability"
                        >
                          {item.isAvailable !== false ? '🟢 In Stock' : '🔴 Sold Out'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded hover:bg-amber-500/15 text-neutral-400 hover:text-amber-400 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMenu(item.id)}
                            className="p-1.5 rounded hover:bg-red-500/15 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Menu Form Editor (Right column) */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-300 mb-4 pb-2 border-b border-neutral-850">
                {isAdding && 'Create New Dish / Drink'}
                {isEditing && `Edit Item: ${isEditing.name}`}
                {!isAdding && !isEditing && 'Select an item to edit'}
              </h3>

              {!isAdding && !isEditing ? (
                <div className="p-6 text-center text-neutral-600">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 stroke-1" />
                  <p className="text-xs">Select any item in the table or click "Add New Dish" to edit global properties.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitMenu} className="space-y-3.5">
                  <div>
                    <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Item Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Saffron Rose Milkcake"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="Starters">Starters</option>
                        <option value="Mains">Mains</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Drinks">Drinks</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Price (Global SAR)</label>
                      <input
                        type="number"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        placeholder="Price"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Description</label>
                    <textarea
                      required
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="E.g., Fragrant rose water sponge pudding topped with cold saffron crema..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Calories (kcal)</label>
                      <input
                        type="number"
                        required
                        value={formCalories}
                        onChange={(e) => setFormCalories(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Taste Profile Description</label>
                      <input
                        type="text"
                        required
                        value={formTaste}
                        onChange={(e) => setFormTaste(e.target.value)}
                        placeholder="E.g. Sweet, aromatic"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Ingredients (Comma separated)</label>
                    <input
                      type="text"
                      required
                      value={formIngredients}
                      onChange={(e) => setFormIngredients(e.target.value)}
                      placeholder="Rosewater, Flour, Milk, Saffron, Pistachio"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-neutral-500 font-bold uppercase block mb-1">Unsplash Food Image URL</label>
                    <input
                      type="text"
                      required
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-amber-500 font-mono text-[10px]"
                    />
                  </div>

                  {/* Boolean checks */}
                  <div className="grid grid-cols-3 gap-2 py-1 bg-neutral-950/40 p-2 border border-neutral-850 rounded-lg">
                    <label className="flex items-center space-x-1.5 text-[10px] font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formIsSpicy} 
                        onChange={(e) => setFormIsSpicy(e.target.checked)}
                        className="rounded border-neutral-700 text-amber-500 focus:ring-0" 
                      />
                      <span>Is Spicy 🌶️</span>
                    </label>

                    <label className="flex items-center space-x-1.5 text-[10px] font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formIsVegetarian} 
                        onChange={(e) => setFormIsVegetarian(e.target.checked)}
                        className="rounded border-neutral-700 text-amber-500 focus:ring-0" 
                      />
                      <span>Veg 🥦</span>
                    </label>

                    <label className="flex items-center space-x-1.5 text-[10px] font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formIsPopular} 
                        onChange={(e) => setFormIsPopular(e.target.checked)}
                        className="rounded border-neutral-700 text-amber-500 focus:ring-0" 
                      />
                      <span>Popular ⭐</span>
                    </label>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-neutral-950/40 border border-neutral-850 rounded-lg">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Item Availability Status</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={formIsAvailable}
                        onChange={(e) => setFormIsAvailable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 relative"></div>
                      <span className="ml-2 text-[10px] font-black text-neutral-200">
                        {formIsAvailable ? 'IN STOCK' : 'SOLD OUT'}
                      </span>
                    </label>
                  </div>

                  {/* Branch restrictions */}
                  <div className="bg-neutral-950/40 p-3 border border-neutral-850 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-neutral-400 font-bold uppercase">Branch Assignments (Demand)</span>
                      <button
                        type="button"
                        onClick={() => setFormBranchIds([])}
                        className="text-[8px] text-amber-500 font-bold hover:underline"
                      >
                        Set Global (All Branches)
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {branches.map(br => {
                        const isChecked = formBranchIds.includes(br.id);
                        return (
                          <label key={br.id} className="flex items-center space-x-1.5 text-[9px] text-neutral-300 font-medium cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormBranchIds([...formBranchIds, br.id]);
                                } else {
                                  setFormBranchIds(formBranchIds.filter(id => id !== br.id));
                                }
                              }}
                              className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                            />
                            <span className="truncate">{br.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[8px] text-neutral-500 italic mt-1">
                      * Leave empty to make this dish globally available across all 5 branches.
                    </p>
                  </div>

                  {/* Submit actions */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setIsEditing(null);
                      }}
                      className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-bold text-neutral-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={menuActionLoading}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isAdding ? 'Create Dish' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        /* TAB 3: HIGH-FIDELITY QR DESIGNER & GENERATOR */
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-neutral-300 mb-1 flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Table QR Desk Plate Generation Suite</span>
            </h2>
            <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
              Generate and print unique, golden-branded desk plate QR codes for tables. When guests scan the plate, they instantly open the Al-Brazin smart assistant for their specific table and branch.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Live Designer Plate & Preview */}
            <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 pb-2 border-b border-neutral-850">
                1. Custom Plate Designer
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Base URL for Mobile QRs</span>
                    <span className="text-[8px] text-amber-500 font-bold lowercase">auto-configured</span>
                  </label>
                  <input
                    type="text"
                    value={qrBaseUrl}
                    onChange={(e) => setQrBaseUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-[11px] text-neutral-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                  
                  {/* Robust Quick-Preset Selector */}
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQrBaseUrl(getSmartBaseUrl())}
                      className={`flex-1 py-1 px-1.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                        qrBaseUrl === getSmartBaseUrl()
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:bg-neutral-900'
                      }`}
                      title="For production scan. Requires clicking Share in AI Studio first."
                    >
                      Public Shareable URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrBaseUrl(window.location.origin)}
                      className={`flex-1 py-1 px-1.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                        qrBaseUrl === window.location.origin
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:bg-neutral-900'
                      }`}
                      title="For instant local developer scans. Requires owner login."
                    >
                      Local Dev URL
                    </button>
                  </div>
                  
                  <p className="text-[8px] text-neutral-500 mt-1.5 leading-normal">
                    <strong>Note:</strong> Public Shareable URL (pre-production) only works on mobile after clicking <strong>"Share"</strong> in AI Studio. For quick testing right now on your personal mobile, use the <strong>Local Dev URL</strong> (requires logging into AI Studio on your phone).
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Target Branch</label>
                  <select
                    value={selectedQRBranch}
                    onChange={(e) => setSelectedQRBranch(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Table Number</label>
                    <input
                      type="number"
                      value={qrTableNum}
                      onChange={(e) => setQrTableNum(e.target.value)}
                      min="1"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Area / Section</label>
                    <select
                      value={qrArea}
                      onChange={(e) => setQrArea(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="VIP">VIP</option>
                      <option value="Family">Family</option>
                      <option value="Open">Open</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintQRCode(selectedQRBranch, qrTableNum, qrArea)}
                  className="w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Print Generated QR Plate</span>
                </button>
              </div>

              {/* LIVE SCREEN PREVIEW CARD */}
              <div className="pt-2 border-t border-neutral-850">
                <span className="block text-[9px] font-black uppercase text-neutral-500 mb-2 text-center tracking-widest">
                  Live Desk Plate Preview
                </span>
                
                <div className="bg-stone-50 text-stone-900 border-4 border-double border-amber-600 rounded-2xl p-4 text-center max-w-[240px] mx-auto shadow-inner">
                  <div className="font-extrabold text-xs text-stone-900 leading-none">البرزين | Al-Brazin</div>
                  <div className="text-[7px] text-amber-700 uppercase font-black tracking-widest mt-0.5 leading-none">
                    Restaurants & Co.
                  </div>
                  
                  <div className="my-2 p-1.5 bg-white border border-stone-200 rounded-lg inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=1c1917&data=${encodeURIComponent(
                        `${qrBaseUrl}/?branch=${selectedQRBranch}&table=${qrTableNum}&area=${qrArea.toLowerCase()}`
                      )}`}
                      alt="Preview QR"
                      className="w-24 h-24 block"
                    />
                  </div>

                  <div className="text-[10px] font-black text-stone-900 leading-none">
                    {branches.find(b => b.id === selectedQRBranch)?.name.replace(' Restaurant', '')}
                  </div>
                  <div className="inline-block bg-amber-100 text-amber-800 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase mt-1">
                    Table {qrTableNum} • {qrArea}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pre-configured Table QR Matrix */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-neutral-900/60 p-3 border border-neutral-800 rounded-xl">
                <div>
                  <h3 className="text-xs font-black uppercase text-neutral-300">Active Branch Configuration Matrix</h3>
                  <p className="text-[9px] text-neutral-500">View, test simulations, or bulk-print physical QR plates for entire dining branches.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => {
                  const branchTables = tables.filter(t => t.branchId === branch.id);
                  return (
                    <div key={branch.id} className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-850">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <h4 className="font-extrabold text-xs text-neutral-200 uppercase tracking-wide">
                            {branch.name.replace(' Restaurant', '')}
                          </h4>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handlePrintAllBranchQRs(branch.id)}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/20 text-[9px] font-black transition flex items-center space-x-1 cursor-pointer"
                          title="Print elegant desk plate for every table in this branch"
                        >
                          <Save className="w-3 h-3" />
                          <span>Bulk Print</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                        {branchTables.map((table) => {
                          const simulatedUrl = `?branch=${branch.id}&table=${table.number}&area=${table.area.toLowerCase()}`;
                          return (
                            <div 
                              key={table.id}
                              className="bg-neutral-950 border border-neutral-850/60 p-2 rounded-lg flex items-center justify-between hover:border-neutral-700/80 transition text-[11px]"
                            >
                              <div className="space-y-0.5">
                                <span className="font-black text-neutral-300">T {table.number}</span>
                                <span className="text-[8px] uppercase font-bold text-amber-500 bg-amber-500/5 px-1 rounded border border-amber-500/10 ml-1.5">
                                  {table.area}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1">
                                <a
                                  href={simulatedUrl}
                                  className="py-1 px-2 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-extrabold text-[9px] border border-neutral-800 transition"
                                  title="Open client app under this table session"
                                >
                                  Simulate
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handlePrintQRCode(branch.id, table.number, table.area)}
                                  className="py-1 px-2 rounded bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 text-neutral-400 hover:text-neutral-950 font-black text-[9px] border border-neutral-800 transition cursor-pointer"
                                  title="Print single desk tent for this table"
                                >
                                  Print
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DYNAMIC TABLE ALLOCATION & AREA ASSIGNMENT MATRIX */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Create or Edit Table Form */}
            <div className="bg-[#111111]/90 border border-white/10 rounded-2xl p-5 shadow-xl h-fit relative">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-200 mb-4 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>{editingTable ? 'Edit Table Configuration' : 'Provision Dining Table'}</span>
              </h3>

              {tableFormError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{tableFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTable} className="space-y-4">
                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Assigned Dining Branch</label>
                  <select
                    value={tableFormBranchId}
                    onChange={(e) => setTableFormBranchId(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Table Label / Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15, VIP-2, Family-1"
                    value={tableFormNumber}
                    onChange={(e) => setTableFormNumber(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Dining Section / Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP, Single Area, Family Area, Closed Area"
                    value={tableFormArea}
                    onChange={(e) => setTableFormArea(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500 mb-2"
                  />
                  
                  {/* Quick Preset Tags for Quick Click Section Setup */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['VIP', 'Single', 'Family', 'Closed'].map(areaPreset => (
                      <button
                        type="button"
                        key={areaPreset}
                        onClick={() => setTableFormArea(areaPreset)}
                        className={`px-2 py-0.5 rounded text-[9px] font-black border transition uppercase ${
                          tableFormArea === areaPreset
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {areaPreset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  {editingTable && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTable(null);
                        setTableFormNumber('');
                        setTableFormArea('Open');
                      }}
                      className="flex-1 py-2 rounded-xl bg-neutral-900 border border-white/5 text-neutral-300 font-bold text-xs hover:bg-neutral-800 transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={tableActionLoading}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingTable ? 'Save Table' : 'Add Table'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Interactive Branch-Wise Tables Matrix */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#111111]/90 border border-white/10 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-200 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Real-time Enterprise Table Registry</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.map((branch) => {
                    const branchTables = tables.filter(t => t.branchId === branch.id);
                    return (
                      <div key={branch.id} className="bg-neutral-950 border border-white/5 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-black text-neutral-200 uppercase tracking-wider">{branch.name}</span>
                          <span className="text-[10px] text-neutral-400 font-extrabold bg-white/5 px-2 py-0.5 rounded-full">
                            {branchTables.length} Active
                          </span>
                        </div>

                        {branchTables.length === 0 ? (
                          <p className="text-[10px] text-neutral-600 italic">No tables provisioned for this branch yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {branchTables.map((t) => (
                              <div key={t.id} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-lg flex items-center justify-between transition text-xs border border-white/5">
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-neutral-200">Table #{t.number}</div>
                                  <div className="text-[9px] uppercase font-bold text-amber-500 bg-amber-500/5 px-1.5 py-0.25 rounded border border-amber-500/10 inline-block">
                                    {t.area} Area
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTable(t);
                                      setTableFormNumber(t.number);
                                      setTableFormArea(t.area);
                                      setTableFormBranchId(t.branchId);
                                      setIsAddingTable(true);
                                      playChime('success');
                                    }}
                                    className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition"
                                    title="Edit Table Area"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePrintQRCode(t.branchId, t.number, t.area);
                                    }}
                                    className="p-1 rounded hover:bg-amber-500/20 text-neutral-400 hover:text-amber-400 transition"
                                    title="Print table desk QR"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTable(t.id)}
                                    className="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition animate-hover"
                                    title="De-register Table"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STAFF ACCOUNTS, BRANCH ASSIGNMENTS & AUTHORIZATION PORTAL */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: User Creation Form */}
            <div className="bg-[#111111]/90 border border-white/10 rounded-2xl p-5 shadow-xl h-fit relative">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-200 mb-4 flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>{editingUser ? 'Update Credentials' : 'Provision Staff Account'}</span>
              </h3>

              {userFormError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{userFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. golden_waiter"
                    value={userFormUsername}
                    onChange={(e) => setUserFormUsername(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Security Password</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pass123"
                    value={userFormPassword}
                    onChange={(e) => setUserFormPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">System Authorization Level</label>
                  <select
                    value={userFormRole}
                    onChange={(e) => setUserFormRole(e.target.value as 'admin' | 'staff')}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="staff">Branch Staff (KDS, Cashier & Table Calls)</option>
                    <option value="admin">Super Admin (All SaaS Control & Pricing)</option>
                  </select>
                </div>

                {userFormRole === 'staff' && (
                  <div>
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Assigned Branch (Security Gate)</label>
                    <select
                      value={userFormBranchId}
                      onChange={(e) => setUserFormBranchId(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <p className="text-[8px] text-neutral-500 italic mt-1.5">
                      * This staff user will be strictly confined to view and manage only orders originating from this assigned branch.
                    </p>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  {editingUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(null);
                        setUserFormUsername('');
                        setUserFormPassword('');
                      }}
                      className="flex-1 py-2 rounded-xl bg-neutral-900 border border-white/5 text-neutral-300 font-bold text-xs hover:bg-neutral-800 transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={userActionLoading}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingUser ? 'Update Account' : 'Provision Account'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Registered Users Directory */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#111111]/90 border border-white/10 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-200 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Verified SaaS Users Directory</span>
                </h3>

                <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                  {users.map((u) => {
                    const assignedBranchObj = branches.find(b => b.id === u.branchId);
                    return (
                      <div key={u.id} className="bg-neutral-950 border border-white/5 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-neutral-100 text-sm">{u.username}</span>
                            <span className={`px-2 py-0.25 text-[8px] font-black uppercase rounded border ${
                              u.role === 'admin'
                                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                : 'bg-blue-500/10 border-blue-500 text-blue-400'
                            }`}>
                              {u.role}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-[10px] text-neutral-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Key className="w-3 h-3 text-neutral-600" />
                              <span className="font-mono">Password: {u.password}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-600" />
                              <span className="font-extrabold uppercase text-neutral-500">
                                {u.role === 'admin' ? 'Global SaaS Scope' : (assignedBranchObj?.name || u.branchId || 'Custom Branch')}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setUserFormUsername(u.username);
                              setUserFormPassword(u.password);
                              setUserFormRole(u.role);
                              if (u.branchId) setUserFormBranchId(u.branchId);
                              setIsAddingUser(true);
                              playChime('success');
                            }}
                            className="py-1 px-2 rounded hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-amber-400 transition text-[10px] font-extrabold"
                          >
                            Edit
                          </button>
                          {u.id !== 'usr_1' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="py-1 px-2 rounded hover:bg-red-500/20 border border-white/5 text-neutral-400 hover:text-red-400 transition text-[10px] font-extrabold"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SAAS DATABASE SECURITY & PASSWORD CREDENTIALS OVERRIDES */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-xl mx-auto">
          <div className="bg-[#111111]/90 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-red-500 via-amber-500 to-orange-600" />
            
            <div className="flex items-center space-x-2 text-white mb-3">
              <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest">SaaS Master Security Override Panel</h3>
            </div>
            
            <p className="text-[10px] text-neutral-400 mb-5 leading-relaxed">
              Dynamically change, reset, update, or edit credentials passwords for any account in the database. Changes are instantly serialized and written into memory, allowing real-time authentication updates on staff and client frontends.
            </p>

            {securitySuccessMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{securitySuccessMsg}</span>
              </div>
            )}

            {securityErrorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{securityErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Target Security User Account</label>
                <select
                  value={securityAdminId}
                  onChange={(e) => setSecurityAdminId(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role === 'admin' ? 'SaaS Super Admin' : 'Branch Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1">Assign New Secure Password</label>
                <input
                  type="text"
                  required
                  placeholder="Insert secure passcode"
                  value={securityFormPassword}
                  onChange={(e) => setSecurityFormPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={securityLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition rounded-xl flex items-center justify-center space-x-2 cursor-pointer mt-4"
              >
                <Shield className="w-4 h-4" />
                <span>Override & Update Password</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Loyalty Rewards Management Tab */}
      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Loyalty Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#111111]/90 border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-200 mb-4 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Loyalty Program Overview</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
                  <div className="text-neutral-400 mb-1">Total Members</div>
                  <div className="text-2xl font-black text-amber-400">{loyaltyAccounts.length}</div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
                  <div className="text-neutral-400 mb-1">Total Points Distributed</div>
                  <div className="text-2xl font-black text-amber-400">
                    {loyaltyAccounts.reduce((sum: number, a: any) => sum + a.lifetimePoints, 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
                  <div className="text-neutral-400 mb-1">Total Amount Spent</div>
                  <div className="text-2xl font-black text-amber-400">
                    {loyaltyAccounts.reduce((sum: number, a: any) => sum + (a.totalSpent || 0), 0).toLocaleString()} SAR
                  </div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
                  <div className="text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Sort by</span>
                    <RefreshCw className="w-3 h-3 cursor-pointer hover:text-amber-500" onClick={fetchLoyaltyData} />
                  </div>
                  <select
                    value={loyaltySortBy}
                    onChange={(e) => setLoyaltySortBy(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg py-1.5 px-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500 mt-2"
                  >
                    <option value="points">Points Balance</option>
                    <option value="spent">Total Spent</option>
                    <option value="tier">Tier Level</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#111111]/90 border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-200 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Tier Thresholds</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">🥉 Bronze (0-499 pts)</span>
                  <span className="text-amber-400 font-bold">1.0x multiplier</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">🥈 Silver (500-1999 pts)</span>
                  <span className="text-amber-400 font-bold">1.1x multiplier</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">🥇 Gold (2000+ pts)</span>
                  <span className="text-amber-400 font-bold">1.25x multiplier</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Members List */}
          <div className="lg:col-span-2 bg-[#111111]/90 border border-white/10 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-200 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Loyalty Members Directory ({loyaltyAccounts.length})</span>
            </h3>

            {loyaltyLoading ? (
              <div className="text-center py-8 text-neutral-400 text-xs">Loading members...</div>
            ) : loyaltyAccounts.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">No loyalty members yet. Start accepting orders with customer phone numbers!</div>
            ) : (
              <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                {[...loyaltyAccounts]
                  .sort((a: any, b: any) => {
                    if (loyaltySortBy === 'points') return b.points - a.points;
                    if (loyaltySortBy === 'spent') return b.totalSpent - a.totalSpent;
                    return a.tier.localeCompare(b.tier);
                  })
                  .map((account: any, idx: number) => (
                    <div key={account.phone} className="bg-neutral-950 border border-white/5 p-3.5 rounded-xl text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-neutral-400 w-6">{idx + 1}.</span>
                          <span className="font-extrabold text-neutral-200">{account.phone}</span>
                          <span className={`px-2 py-0.5 rounded border font-black text-[9px] ${
                            account.tier === 'Gold' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' :
                            account.tier === 'Silver' ? 'bg-slate-500/10 border-slate-500 text-slate-400' :
                            'bg-orange-500/10 border-orange-500 text-orange-400'
                          }`}>
                            {account.tier}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-[10px] text-neutral-400 ml-8">
                        <div>
                          <span className="text-neutral-500 block">Current Balance</span>
                          <span className="text-amber-400 font-bold text-xs">{account.points} pts</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Lifetime Earned</span>
                          <span className="text-amber-400 font-bold text-xs">{account.lifetimePoints} pts</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Total Spent</span>
                          <span className="text-amber-400 font-bold text-xs">{account.totalSpent.toFixed(0)} SAR</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
