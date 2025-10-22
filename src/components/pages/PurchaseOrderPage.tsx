import { useState, useEffect } from 'react';
import axios from 'axios';
import type { UserRole } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Edit, Trash2, Eye, Search, FileText, Clock, CheckCircle2, XCircle, ChevronDown, Truck, Printer } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

interface PurchaseOrderPageProps {
  userRole: UserRole;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  date: string;
  supplier: string;
  amount: number;
  status: 'ร่าง' | 'รอจัดส่ง' | 'จัดส่งแล้ว' | 'ยกเลิก';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PurchaseOrderPage({ userRole }: PurchaseOrderPageProps) {
  const API_URL = 'http://127.0.0.1:8000/api/purchase-orders';
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    po_number: '',
    supplier: '',
    date: '',
    amount: '',
    description: '',
    status: 'ร่าง' as 'ร่าง' | 'รอจัดส่ง' | 'จัดส่งแล้ว' | 'ยกเลิก',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Fetch data from API
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === 'ร่าง').length,
    รอจัดส่ง: data.filter((item) => item.status === 'รอจัดส่ง').length,
    จัดส่งแล้ว: data.filter((item) => item.status === 'จัดส่งแล้ว').length,
    ยกเลิก: data.filter((item) => item.status === 'ยกเลิก').length,
  };

  const generatePONumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = data.length + 1;
    return `PO-${year}${month}-${String(count).padStart(3, '0')}`;
  };

  const handleAdd = async () => {
    try {
      const payload = {
        po_number: formData.po_number || generatePONumber(),
        date: formData.date,
        supplier: formData.supplier,
        amount: Number(formData.amount),
        status: formData.status,
        description: formData.description,
      };

      const response = await axios.post(API_URL, payload);
      toast.success('สร้างใบสั่งซื้อสำเร็จ');
      setIsAddDialogOpen(false);
      setFormData({ po_number: '', supplier: '', date: '', amount: '', description: '', status: 'ร่าง' });
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error('Error adding purchase order:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ');
    }
  };

  const handleEdit = (item: PurchaseOrder) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      po_number: item.po_number,
      supplier: item.supplier,
      date: item.date,
      amount: String(item.amount),
      description: item.description || '',
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      const payload = {
        po_number: formData.po_number,
        date: formData.date,
        supplier: formData.supplier,
        amount: Number(formData.amount),
        status: formData.status,
        description: formData.description,
      };

      await axios.put(`${API_URL}/${selectedItem.id}`, payload);
      toast.success('แก้ไขใบสั่งซื้อสำเร็จ');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setFormData({ po_number: '', supplier: '', date: '', amount: '', description: '', status: 'ร่าง' });
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error('Error updating purchase order:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขใบสั่งซื้อ');
    }
  };

  const handleView = (item: PurchaseOrder) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: PurchaseOrder) => {
    if (!canDelete) {
      toast.error('คุณไม่มีสิทธิ์ลบข้อมูล');
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await axios.delete(`${API_URL}/${selectedItem.id}`);
      toast.success(`ลบใบสั่งซื้อ ${selectedItem.po_number} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error('Error deleting purchase order:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบใบสั่งซื้อ');
    }
  };

  const handleStatusChange = async (item: PurchaseOrder, newStatus: 'ร่าง' | 'รอจัดส่ง' | 'จัดส่งแล้ว' | 'ยกเลิก') => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    try {
      const payload = {
        po_number: item.po_number,
        date: item.date,
        supplier: item.supplier,
        amount: item.amount,
        status: newStatus,
        description: item.description || '',
      };

      await axios.put(`${API_URL}/${item.id}`, payload);
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'ร่าง': 'outline',
      'รอจัดส่ง': 'secondary',
      'จัดส่งแล้ว': 'default',
      'ยกเลิก': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = (item: PurchaseOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('กรุณาอนุญาตให้เปิดหน้าต่างใหม่');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบสั่งซื้อ ${item.po_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@400;600;700&display=swap');

          body {
            font-family: 'Anuphan', sans-serif;
            margin: 40px;
            color: #000;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .info {
            margin-bottom: 30px;
          }
          .info-row {
            margin: 8px 0;
            font-size: 16px;
          }
          .info-label {
            font-weight: 600;
            display: inline-block;
            width: 120px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: 600;
          }
          .text-right {
            text-align: right;
          }
          @media print {
            body {
              margin: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ใบสั่งซื้อ</h1>
        </div>
        <div class="info">
          <div class="info-row"><span class="info-label">เลขที่:</span> ${item.po_number}</div>
          <div class="info-row"><span class="info-label">วันที่:</span> ${new Date(item.date).toLocaleDateString('th-TH')}</div>
          <div class="info-row"><span class="info-label">ผู้จำหน่าย:</span> ${item.supplier}</div>
          <div class="info-row"><span class="info-label">สถานะ:</span> ${item.status}</div>
          ${item.description ? `<div class="info-row"><span class="info-label">รายละเอียด:</span> ${item.description}</div>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>รายการ</th>
              <th class="text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>รวมทั้งสิ้น</td>
              <td class="text-right">฿${item.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success(`เตรียมพิมพ์ ${item.po_number}`);
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('ร่าง')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.ร่าง}</p>
                <p className="text-sm opacity-90">ร่าง</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-orange-400 to-orange-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('รอจัดส่ง')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.รอจัดส่ง}</p>
                <p className="text-sm opacity-90">รอจัดส่ง</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-green-400 to-green-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('จัดส่งแล้ว')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.จัดส่งแล้ว}</p>
                <p className="text-sm opacity-90">จัดส่งแล้ว</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-slate-400 to-slate-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('ยกเลิก')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.ยกเลิก}</p>
                <p className="text-sm opacity-90">ยกเลิก</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการใบสั่งซื้อ</CardTitle>
              {filterStatus !== 'all' && (
                <p className="text-sm text-gray-500 mt-1">
                  กรองตาม: {filterStatus}{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    แสดงทั้งหมด
                  </Button>
                </p>
              )}
            </div>
            <Button onClick={() => {
              setFormData({ po_number: generatePONumber(), supplier: '', date: '', amount: '', description: '', status: 'ร่าง' });
              setIsAddDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบสั่งซื้อ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ค้นหาเลขที่เอกสาร, ผู้จำหน่าย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่เอกสาร</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.po_number}</TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell className="text-right">
                    ฿{item.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled={!canEdit}
                        >
                          {getStatusBadge(item.status)}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'ร่าง')}>
                          <FileText className="w-4 h-4 mr-2" />
                          ร่าง
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'รอจัดส่ง')}>
                          <Clock className="w-4 h-4 mr-2" />
                          รอจัดส่ง
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'จัดส่งแล้ว')}>
                          <Truck className="w-4 h-4 mr-2" />
                          จัดส่งแล้ว
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'ยกเลิก')}>
                          <XCircle className="w-4 h-4 mr-2" />
                          ยกเลิก
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(item)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        disabled={!canEdit}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item)}
                        disabled={!canDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างใบสั่งซื้อใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลใบสั่งซื้อ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เลขที่เอกสาร</Label>
                <Input
                  placeholder="PO-YYYYMM-XXX"
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>วันที่</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ผู้จำหน่าย</Label>
              <Input
                placeholder="ชื่อผู้จำหน่าย"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAdd}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขใบสั่งซื้อ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลใบสั่งซื้อ {selectedItem?.po_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เลขที่เอกสาร</Label>
                <Input
                  placeholder="PO-YYYYMM-XXX"
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>วันที่</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ผู้จำหน่าย</Label>
              <Input
                placeholder="ชื่อผู้จำหน่าย"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleUpdate}>บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดใบสั่งซื้อ</DialogTitle>
            <DialogDescription>เลขที่ {selectedItem?.po_number}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">{selectedItem.po_number}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">{new Date(selectedItem.date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ผู้จำหน่าย</Label>
                <p className="mt-1">{selectedItem.supplier}</p>
              </div>
              <div>
                <Label className="text-gray-500">จำนวนเงิน</Label>
                <p className="mt-1">฿{selectedItem.amount.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>
              {selectedItem.description && (
                <div>
                  <Label className="text-gray-500">รายละเอียด</Label>
                  <p className="mt-1">{selectedItem.description}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setIsViewDialogOpen(false)}>ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบใบสั่งซื้อ {selectedItem?.po_number}?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
