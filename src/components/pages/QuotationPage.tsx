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
import { Plus, Edit, Trash2, Eye, Search, Printer, FileText, Clock, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
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

interface QuotationPageProps {
  userRole: UserRole;
}

interface Quotation {
  id: number;
  quotation_number: string;
  date: string;
  customer: string;
  amount: number;
  status: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
  description?: string;
  valid_until?: string;
  created_at?: string;
  updated_at?: string;
}

export default function QuotationPage({ userRole }: QuotationPageProps) {
  const API_URL = 'http://127.0.0.1:8000/api/quotations';
  const [data, setData] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Quotation | null>(null);
  const [formData, setFormData] = useState({
    quotation_number: '',
    customer: '',
    date: '',
    amount: '',
    description: '',
    valid_until: '',
    status: 'ร่าง' as 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Fetch data from API
  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === 'ร่าง').length,
    รออนุมัติ: data.filter((item) => item.status === 'รออนุมัติ').length,
    อนุมัติแล้ว: data.filter((item) => item.status === 'อนุมัติแล้ว').length,
    ยกเลิก: data.filter((item) => item.status === 'ยกเลิก').length,
  };

  const generateQuotationNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = data.length + 1;
    return `QT-${year}${month}-${String(count).padStart(3, '0')}`;
  };

  const handleAdd = async () => {
    try {
      const payload = {
        quotation_number: formData.quotation_number || generateQuotationNumber(),
        date: formData.date,
        customer: formData.customer,
        amount: Number(formData.amount),
        status: formData.status,
        description: formData.description,
        valid_until: formData.valid_until || null,
      };

      await axios.post(API_URL, payload);
      toast.success('สร้างใบเสนอราคาสำเร็จ');
      setIsAddDialogOpen(false);
      setFormData({ quotation_number: '', customer: '', date: '', amount: '', description: '', valid_until: '', status: 'ร่าง' });
      fetchQuotations();
    } catch (error: any) {
      console.error('Error adding quotation:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา');
    }
  };

  const handleEdit = (item: Quotation) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      quotation_number: item.quotation_number,
      customer: item.customer,
      date: item.date,
      amount: String(item.amount),
      description: item.description || '',
      valid_until: item.valid_until || '',
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      const payload = {
        quotation_number: formData.quotation_number,
        date: formData.date,
        customer: formData.customer,
        amount: Number(formData.amount),
        status: formData.status,
        description: formData.description,
        valid_until: formData.valid_until || null,
      };

      await axios.put(`${API_URL}/${selectedItem.id}`, payload);
      toast.success('แก้ไขใบเสนอราคาสำเร็จ');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setFormData({ quotation_number: '', customer: '', date: '', amount: '', description: '', valid_until: '', status: 'ร่าง' });
      fetchQuotations();
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขใบเสนอราคา');
    }
  };

  const handleView = (item: Quotation) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: Quotation) => {
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
      toast.success(`ลบใบเสนอราคา ${selectedItem.quotation_number} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchQuotations();
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบใบเสนอราคา');
    }
  };

  const handleStatusChange = async (item: Quotation, newStatus: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก') => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    try {
      const payload = {
        quotation_number: item.quotation_number,
        date: item.date,
        customer: item.customer,
        amount: item.amount,
        status: newStatus,
        description: item.description || '',
        valid_until: item.valid_until || null,
      };

      await axios.put(`${API_URL}/${item.id}`, payload);
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchQuotations();
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'ร่าง': 'outline',
      'รออนุมัติ': 'secondary',
      'อนุมัติแล้ว': 'default',
      'ยกเลิก': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = (item: Quotation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('กรุณาอนุญาตให้เปิดหน้าต่างใหม่');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสนอราคา ${item.quotation_number}</title>
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
          <h1>ใบเสนอราคา</h1>
        </div>
        <div class="info">
          <div class="info-row"><span class="info-label">เลขที่:</span> ${item.quotation_number}</div>
          <div class="info-row"><span class="info-label">วันที่:</span> ${new Date(item.date).toLocaleDateString('th-TH')}</div>
          <div class="info-row"><span class="info-label">ลูกค้า:</span> ${item.customer}</div>
          <div class="info-row"><span class="info-label">สถานะ:</span> ${item.status}</div>
          ${item.valid_until ? `<div class="info-row"><span class="info-label">ใช้ได้ถึง:</span> ${new Date(item.valid_until).toLocaleDateString('th-TH')}</div>` : ''}
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
    toast.success(`เตรียมพิมพ์ ${item.quotation_number}`);
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
          onClick={() => setFilterStatus('รออนุมัติ')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.รออนุมัติ}</p>
                <p className="text-sm opacity-90">รออนุมัติ</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-green-400 to-green-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('อนุมัติแล้ว')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.อนุมัติแล้ว}</p>
                <p className="text-sm opacity-90">อนุมัติแล้ว</p>
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
              <CardTitle>รายการใบเสนอราคา</CardTitle>
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
              setFormData({ quotation_number: generateQuotationNumber(), customer: '', date: '', amount: '', description: '', valid_until: '', status: 'ร่าง' });
              setIsAddDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบเสนอราคา
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ค้นหาเลขที่เอกสาร, ลูกค้า..."
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
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.quotation_number}</TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{item.customer}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'รออนุมัติ')}>
                          <Clock className="w-4 h-4 mr-2" />
                          รออนุมัติ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'อนุมัติแล้ว')}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          อนุมัติแล้ว
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
            <DialogTitle>สร้างใบเสนอราคาใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลใบเสนอราคา</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เลขที่เอกสาร</Label>
                <Input
                  placeholder="QT-YYYYMM-XXX"
                  value={formData.quotation_number}
                  onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
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
              <Label>ลูกค้า</Label>
              <Input
                placeholder="ชื่อลูกค้า"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>ใช้ได้ถึงวันที่ (ถ้ามี)</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
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
            <DialogTitle>แก้ไขใบเสนอราคา</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลใบเสนอราคา {selectedItem?.quotation_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เลขที่เอกสาร</Label>
                <Input
                  placeholder="QT-YYYYMM-XXX"
                  value={formData.quotation_number}
                  onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
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
              <Label>ลูกค้า</Label>
              <Input
                placeholder="ชื่อลูกค้า"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>ใช้ได้ถึงวันที่ (ถ้ามี)</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
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
            <DialogTitle>รายละเอียดใบเสนอราคา</DialogTitle>
            <DialogDescription>เลขที่ {selectedItem?.quotation_number}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">{selectedItem.quotation_number}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">{new Date(selectedItem.date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า</Label>
                <p className="mt-1">{selectedItem.customer}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">จำนวนเงิน</Label>
                  <p className="mt-1">฿{selectedItem.amount.toLocaleString()}</p>
                </div>
                {selectedItem.valid_until && (
                  <div>
                    <Label className="text-gray-500">ใช้ได้ถึงวันที่</Label>
                    <p className="mt-1">{new Date(selectedItem.valid_until).toLocaleDateString('th-TH')}</p>
                  </div>
                )}
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
              คุณแน่ใจหรือไม่ว่าต้องการลบใบเสนอราคา {selectedItem?.quotation_number}?
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
