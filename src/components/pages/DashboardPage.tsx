import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { UserRole } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardPageProps {
  userRole: UserRole;
}

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalReceivables: number;
  totalPayables: number;
  salesGrowth: number;
  purchasesGrowth: number;
  receivablesGrowth: number;
  payablesGrowth: number;
}

interface MonthlySales {
  month: string;
  sales: number;
  purchase: number;
}

interface CategoryData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface RecentTransaction {
  type: string;
  no: string;
  customer: string;
  amount: string;
  date: string;
}

interface Receipt {
  id: number;
  receipt_no: string;
  date: string;
  customer: string;
  amount: number;
  status: string;
}

interface ReceiveVoucher {
  id: number;
  voucher_no: string;
  date: string;
  payer: string;
  amount: number;
  status: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function DashboardPage({ userRole }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchases: 0,
    totalReceivables: 0,
    totalPayables: 0,
    salesGrowth: 0,
    purchasesGrowth: 0,
    receivablesGrowth: 0,
    payablesGrowth: 0,
  });
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel with error handling
      const [
        quotationsRes,
        invoicesRes,
        receiptsRes,
        purchaseOrdersRes,
        receiveVouchersRes,
      ] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/quotations`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/invoices`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/receipts`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/purchase-orders`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/receive-vouchers`).catch(() => ({ data: [] })),
      ]);

      // Extract data from settled promises
      const quotations = quotationsRes.status === 'fulfilled' ? quotationsRes.value.data : [];
      const invoices = invoicesRes.status === 'fulfilled' ? invoicesRes.value.data : [];
      const receipts = receiptsRes.status === 'fulfilled' ? receiptsRes.value.data : [];
      const purchaseOrders = purchaseOrdersRes.status === 'fulfilled' ? purchaseOrdersRes.value.data : [];
      const receiveVouchers = receiveVouchersRes.status === 'fulfilled' ? receiveVouchersRes.value.data : [];

      // Calculate stats
      calculateStats(
        quotations,
        invoices,
        receipts,
        purchaseOrders,
        receiveVouchers
      );

      // Calculate monthly sales
      calculateMonthlySales(receipts, receiveVouchers);

      // Calculate category data
      calculateCategoryData(receipts);

      // Get recent transactions
      getRecentTransactions(
        receipts,
        receiveVouchers
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (
    _quotations: unknown[],
    _invoices: unknown[],
    receipts: Receipt[],
    _purchaseOrders: unknown[],
    receiveVouchers: ReceiveVoucher[]
  ) => {
    // Calculate total sales (from receipts with status "ออกแล้ว")
    // Since we don't have invoices yet, we use receipts as sales
    const totalSales = receipts
      .filter(r => r.status === 'ออกแล้ว')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // Calculate total purchases (from receive vouchers with status "รับแล้ว")
    // Since we don't have purchase orders yet, we use receive vouchers as purchases
    const totalPurchases = receiveVouchers
      .filter(rv => rv.status === 'รับแล้ว')
      .reduce((sum, rv) => sum + Number(rv.amount), 0);

    // Calculate receivables (receipts with status "รอออก" or "ร่าง")
    // These are pending receipts that haven't been issued yet
    const totalReceivables = receipts
      .filter(r => r.status === 'รอออก' || r.status === 'ร่าง')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // Calculate payables (receive vouchers with status "รอรับ" or "รออนุมัติ")
    // These are pending payments
    const totalPayables = receiveVouchers
      .filter(rv => rv.status === 'รอรับ' || rv.status === 'รออนุมัติ')
      .reduce((sum, rv) => sum + Number(rv.amount), 0);

    setStats({
      totalSales,
      totalPurchases,
      totalReceivables,
      totalPayables,
      salesGrowth: 0, // Would need historical data to calculate
      purchasesGrowth: 0,
      receivablesGrowth: 0,
      payablesGrowth: 0,
    });
  };

  const calculateMonthlySales = (receipts: Receipt[], receiveVouchers: ReceiveVoucher[]): void => {
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const currentDate = new Date();
    const last6Months: MonthlySales[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthlySalesAmount = receipts
        .filter(r => {
          const rDate = new Date(r.date);
          return rDate.getMonth() === month &&
                 rDate.getFullYear() === year &&
                 r.status === 'ออกแล้ว';
        })
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const monthlyPurchaseAmount = receiveVouchers
        .filter(rv => {
          const rvDate = new Date(rv.date);
          return rvDate.getMonth() === month &&
                 rvDate.getFullYear() === year &&
                 rv.status === 'รับแล้ว';
        })
        .reduce((sum, rv) => sum + Number(rv.amount), 0);

      last6Months.push({
        month: monthNames[month],
        sales: monthlySalesAmount,
        purchase: monthlyPurchaseAmount,
      });
    }

    setMonthlySales(last6Months);
  };

  const calculateCategoryData = (receipts: Receipt[]): void => {
    // Group by customer as categories (since we don't have product categories)
    const customerSales: { [key: string]: number } = {};

    receipts
      .filter(r => r.status === 'ออกแล้ว')
      .forEach(r => {
        const amount = Number(r.amount);
        if (customerSales[r.customer]) {
          customerSales[r.customer] += amount;
        } else {
          customerSales[r.customer] = amount;
        }
      });

    const categoryArray = Object.entries(customerSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 customers

    setCategoryData(categoryArray);
  };

  const getRecentTransactions = (
    receipts: Receipt[],
    receiveVouchers: ReceiveVoucher[]
  ): void => {
    const transactions: RecentTransaction[] = [];

    // Add receipts
    receipts.slice(0, 2).forEach(r => {
      const amount = Number(r.amount) || 0;
      transactions.push({
        type: 'ใบเสร็จ',
        no: r.receipt_no,
        customer: r.customer,
        amount: `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        date: new Date(r.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
    });

    // Add receive vouchers
    receiveVouchers.slice(0, 2).forEach(rv => {
      const amount = Number(rv.amount) || 0;
      transactions.push({
        type: 'ใบสำคัญรับเงิน',
        no: rv.voucher_no,
        customer: rv.payer,
        amount: `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        date: new Date(rv.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
    });

    // Sort by date and take latest 4
    setRecentTransactions(transactions.slice(0, 4));
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">สรุปยอดขาย</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">฿{stats.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              {stats.salesGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={stats.salesGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">จากเดือนที่แล้ว</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">สรุปยอดซื้อ</CardTitle>
            <ShoppingCart className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">฿{stats.totalPurchases.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              {stats.purchasesGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={stats.purchasesGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {stats.purchasesGrowth >= 0 ? '+' : ''}{stats.purchasesGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">จากเดือนที่แล้ว</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">ยอดลูกหนี้</CardTitle>
            <Receipt className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">฿{stats.totalReceivables.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              {stats.receivablesGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              )}
              <span className={stats.receivablesGrowth >= 0 ? "text-red-500" : "text-green-500"}>
                {stats.receivablesGrowth >= 0 ? '+' : ''}{stats.receivablesGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">จากเดือนที่แล้ว</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">ยอดเจ้าหนี้</CardTitle>
            <Users className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">฿{stats.totalPayables.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              {stats.payablesGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              )}
              <span className={stats.payablesGrowth >= 0 ? "text-red-500" : "text-green-500"}>
                {stats.payablesGrowth >= 0 ? '+' : ''}{stats.payablesGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">จากเดือนที่แล้ว</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ยอดขายและยอดซื้อรายเดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" name="ยอดขาย" fill="#3b82f6" />
                <Bar dataKey="purchase" name="ยอดซื้อ" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มยอดขาย 6 เดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="ยอดขาย"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนการขายตามลูกค้า (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name }) => name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-[300px] text-gray-500">
                ไม่มีข้อมูลการขาย
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รายการล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm">{item.type} #{item.no}</p>
                      <p className="text-xs text-gray-500">{item.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{item.amount}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-[200px] text-gray-500">
                  ไม่มีรายการล่าสุด
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
