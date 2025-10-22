import { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

interface ProductPageProps {
  userRole: UserRole;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  category_id: number | null;
  category?: Category;
  price: number;
  stock: number | null;
  status: 'active' | 'inactive';
}

export default function ProductPage({ userRole }: ProductPageProps) {
  const API_URL = 'http://127.0.0.1:8000/api/products';
  const CATEGORY_URL = 'http://127.0.0.1:8000/api/categories';

  const [data, setData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    price: '',
    stock: '',
    status: 'active' as 'active' | 'inactive',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('โหลดข้อมูลสินค้าไม่สำเร็จ');
      }
    } catch (error) {
      console.error('API Error:', error);
      toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(CATEGORY_URL);
      if (res.ok) {
        const json = await res.json();
        setCategories(json);
      } else {
        toast.error('โหลดหมวดหมู่ไม่สำเร็จ');
      }
    } catch (error) {
      console.error('API Error:', error);
      toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

 const handleAdd = async () => {
  if (!formData.code || !formData.name || !formData.category_id) {
    toast.error('กรุณากรอกข้อมูลให้ครบ');
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: formData.code,
        name: formData.name,
        category_id: Number(formData.category_id), // ✅ ตรงนี้ต้องใช้ category_id
        price: Number(formData.price),
        stock: formData.stock ? Number(formData.stock) : 0, // ✅ ป้องกัน null
        status: formData.status,
      }),
    });

    if (res.ok) {
      toast.success('เพิ่มสินค้า/บริการสำเร็จ');
      setIsAddDialogOpen(false);
      setFormData({
        code: '',
        name: '',
        category_id: '',
        price: '',
        stock: '',
        status: 'active',
      });
      fetchProducts();
    } else {
      const err = await res.json();
      toast.error(err.message || 'เพิ่มไม่สำเร็จ');
    }
  } catch (error) {
    console.error('API Error:', error);
    toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
  }
};


  const handleEdit = (item: Product) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category_id: item.category_id ? String(item.category_id) : '',
      price: String(item.price),
      stock: item.stock !== null ? String(item.stock) : '',
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      const res = await fetch(`${API_URL}/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          name: formData.name,
          category_id: Number(formData.category_id),
          price: Number(formData.price),
          stock: formData.stock ? Number(formData.stock) : null,
          status: formData.status,
        }),
      });

      if (res.ok) {
        toast.success('แก้ไขข้อมูลสำเร็จ');
        setIsEditDialogOpen(false);
        setSelectedItem(null);
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.message || 'แก้ไขไม่สำเร็จ');
      }
    } catch (error) {
      console.error('API Error:', error);
      toast.error('เชื่อมต่อ API ไม่ได้');
    }
  };

  const handleView = (item: Product) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: Product) => {
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
      const res = await fetch(`${API_URL}/${selectedItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`ลบ ${selectedItem.name} สำเร็จ`);
        fetchProducts();
      } else {
        toast.error('ลบไม่สำเร็จ');
      }
    } catch (error) {
      console.error('API Error:', error);
      toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }

    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      active: 'default',
      inactive: 'secondary',
    };
    return <Badge variant={variants[status]}>{status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</Badge>;
  };

  const filteredData = data.filter(
    (item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>สินค้าและบริการ</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มสินค้า/บริการ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหารหัส, ชื่อสินค้า/บริการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อสินค้า/บริการ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">ราคา</TableHead>
                <TableHead className="text-right">คงเหลือ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell className="text-right">฿{item.price.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {item.stock !== null ? (
                      <span className={item.stock === 0 ? 'text-red-500' : ''}>{item.stock}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={!canEdit}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)} disabled={!canDelete}>
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
            <DialogTitle>เพิ่มสินค้า/บริการใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลสินค้า/บริการ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input
                  placeholder="PRD-XXX"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อสินค้า/บริการ</Label>
                <Input
                  placeholder="ชื่อสินค้า"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
            <Label>หมวดหมู่</Label>
<Select
  value={formData.category_id}
  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="เลือกหมวดหมู่" />
  </SelectTrigger>
  <SelectContent>
    {categories.map((cat) => (
      <SelectItem key={cat.id} value={cat.id.toString()}>
        {cat.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>



            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ราคา (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>คงเหลือ</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleAdd}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขสินค้า/บริการ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูล {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input
                  placeholder="PRD-XXX"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อสินค้า/บริการ</Label>
                <Input
                  placeholder="ชื่อสินค้า"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ราคา (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>คงเหลือ</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleUpdate}>บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดสินค้า/บริการ</DialogTitle>
            <DialogDescription>{selectedItem?.code}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">รหัส</Label>
                  <p className="mt-1">{selectedItem.code}</p>
                </div>
                <div>
                  <Label className="text-gray-500">ชื่อสินค้า/บริการ</Label>
                  <p className="mt-1">{selectedItem.name}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">หมวดหมู่</Label>
                <p className="mt-1">{selectedItem.category?.name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ราคา</Label>
                  <p className="mt-1">฿{selectedItem.price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">คงเหลือ</Label>
                  <p className="mt-1">
                    {selectedItem.stock !== null ? selectedItem.stock : '-'}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsViewDialogOpen(false)}>ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า/บริการ “{selectedItem?.name}”?  
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
