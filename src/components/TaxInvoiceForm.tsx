import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Plus, Trash2, Printer } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { customerService } from '../services/customerService';
import type { Customer } from '../services/customerService';
import { productService } from '../services/productService';
import type { Product } from '../services/productService';
import { toast } from 'sonner';




interface InvoiceItem {
  id: string;
  productId?: number;
  description: string;
  amount: number;
}

interface TaxInvoiceFormProps {
  documentType: 'invoice' | 'receipt';
  onSave: (data: any) => void;
  onCancel: () => void;
}



// เอกสารต้นฉบับที่สามารถเลือกได้
const sourceDocuments = [
  {
    id: '1',
    code: 'QT250001',
    name: 'ใบเสนอราคา - บริษัท ABC จำกัด',
    customer: 'บริษัท ABC จำกัด',
  },
  {
    id: '2',
    code: 'PO250002',
    name: 'ใบสั่งซื้อ - บริษัท XYZ จำกัด',
    customer: 'บริษัท XYZ จำกัด',
  },
  {
    id: '3',
    code: 'INV250010',
    name: 'ใบแจ้งหนี้ - ร้าน DEF การค้า',
    customer: 'ร้าน DEF การค้า',
  },
];

export default function TaxInvoiceForm({
  documentType,
  onSave,
  onCancel,
}: TaxInvoiceFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [docNumber, setDocNumber] = useState(() => {
    const prefix = documentType === 'invoice' ? 'TINV' : 'REC';
    return `${prefix}${Date.now().toString().slice(-6)}`;
  });
  const [docDate, setDocDate] = useState(today);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [openCustomer, setOpenCustomer] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('1. การชำระเงินภายในเวลาที่กำหนด 7 วัน ตั้งแต่วันที่ได้รับสินค้า\n2. การส่งมอบสินค้าต้องเป็นไปตามเงื่อนไขที่ระบุไว้ในใบสั่งซื้อนี้เท่านั้น คลาง POSTER ONLY การขนส่ง\n3. ค่าบริการจัดส่งคิดตามระยะทางจริงรวมภาษีมูลค่าเพิ่ม');
  const [discount, setDiscount] = useState(0);
  const [vatRate, setVatRate] = useState(7);

  // ข้อมูลการจัดส่ง
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  // โหลดข้อมูลลูกค้าและสินค้าจากฐานข้อมูล
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerList, productList] = await Promise.all([
          customerService.getActiveCustomers(),
          productService.getAll()
        ]);
        setCustomers(customerList);
        setProducts(productList);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    };
    loadData();
  }, []);

  const getDocumentTitle = () => {
    return documentType === 'invoice' ? 'ใบแจ้งหนี้/ใบกำกับภาษี' : 'ใบเสร็จรับเงิน/ใบกำกับภาษี';
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleSelectProduct = (itemId: string, product: Product) => {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: product.id,
              description: product.name,
              amount: Number(product.price) || 0,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'description' | 'amount', value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateAfterDiscount = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const calculateVat = () => {
    return (calculateAfterDiscount() * vatRate) / 100;
  };

  const calculateGrandTotal = () => {
    return calculateAfterDiscount() + calculateVat();
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error('กรุณาเลือกลูกค้า');
      return;
    }

    if (items.length === 0) {
      toast.error('กรุณาเพิ่มรายการสินค้า');
      return;
    }

    const data = {
      documentType: documentType,
      docNumber,
      docDate,
      customer: selectedCustomer,
      selectedDocument,
      items,
      notes,
      discount,
      vatRate,
      shippingAddress,
      shippingPhone,
      subtotal: calculateSubtotal(),
      discountAmount: calculateDiscountAmount(),
      afterDiscount: calculateAfterDiscount(),
      vat: calculateVat(),
      grandTotal: calculateGrandTotal(),
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/tax-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('บันทึกเอกสารสำเร็จ');
        onSave(data);
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + (result.message || 'ไม่สามารถบันทึกได้'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const activeCustomers = customers.filter((c: Customer) => c.status === 'active');

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{getDocumentTitle()}</h2>
        <Button variant="outline" className="text-cyan-500 border-cyan-500">
          NEW DELIVERY
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Document Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>เลขที่เอกสาร</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>แท้น</Label>
              <Select defaultValue="แท้น">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="แท้น">แท้น</SelectItem>
                  <SelectItem value="สำเนา">สำเนา</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>วันที่เริ่มต้น</Label>
              <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
            </div>
          </div>

          {/* Source Document Selection */}
          <div className="space-y-2">
            <Label>เลือกเอกสาร</Label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเอกสารต้นทาง..." />
              </SelectTrigger>
              <SelectContent>
                {sourceDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.code} - {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>เลือกลูกค้า</Label>
            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomer}
                  className="w-full justify-between h-auto min-h-[40px]"
                >
                  {selectedCustomer ? (
                    <div className="w-full text-left">
                      <div className="flex gap-2">
                        <span className="text-blue-600">{selectedCustomer.code}</span>
                        <span>-</span>
                        <span>{selectedCustomer.name}</span>
                      </div>
                      {selectedCustomer.address && (
                        <div className="mt-1 text-sm text-gray-500">{selectedCustomer.address}</div>
                      )}
                    </div>
                  ) : (
                    'เลือกลูกค้า...'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0">
                <Command>
                  <CommandInput placeholder="ค้นหาลูกค้า..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                    <CommandGroup>
                      {activeCustomers.map((customer: Customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.code} ${customer.name}`}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setShippingAddress(customer.address || '');
                            setShippingPhone(customer.phone || '');
                            setOpenCustomer(false);
                          }}
                          className="flex flex-col items-start py-3"
                        >
                          <div className="flex gap-2">
                            <span className="text-blue-600">{customer.code}</span>
                            <span>-</span>
                            <span>{customer.name}</span>
                          </div>
                          {customer.address && (
                            <div className="mt-1 text-sm text-gray-500">{customer.address}</div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Customer Details */}
          {selectedCustomer && (
            <div className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-blue-50">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">ชื่อลูกค้า</div>
                <div>{selectedCustomer.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">ประเภท</div>
                <div>{selectedCustomer.type || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">เบอร์โทร</div>
                <div>{selectedCustomer.phone || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี</div>
                <div>{selectedCustomer.tax_id || '-'}</div>
              </div>
            </div>
          )}

          {/* Shipping Information */}
          <div className="space-y-4">
            <Label className="text-base">ข้อมูลการจัดส่งสินค้า</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ที่อยู่</Label>
                <Textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="ที่อยู่จัดส่ง..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทร</Label>
                <Input
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์..."
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>รายการ</Label>
              <Button onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>

            <div className="overflow-hidden border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-[80px] text-center">ลำดับ (SRNO)</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead className="w-[150px] text-right">ราคารวม (จำนวนเงิน)</TableHead>
                    <TableHead className="w-[100px] text-right">รายการลบ (ใบสำคัญถอน)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-gray-400">
                        ไม่มีรายการ
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Select
                              value={item.productId?.toString()}
                              onValueChange={(value) => {
                                const product = products.find(p => p.id === parseInt(value));
                                if (product) {
                                  handleSelectProduct(item.id, product);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกสินค้า/บริการ..." />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - ฿{Number(product.price).toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'description', e.target.value)
                              }
                              placeholder="หรือพิมพ์รายละเอียดเอง..."
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className="text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Notes and Summary */}
          <div className="grid grid-cols-2 gap-6">
            {/* Notes */}
            <div className="space-y-2">
              <Label>โน๊ต</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="เงื่อนไขและข้อกำหนด..."
              />
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>ยอด</span>
                <span>{calculateSubtotal().toLocaleString()} บาท</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>ส่วนลด</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right"
                    min="0"
                    max="100"
                  />
                  <span>%</span>
                  <span className="min-w-[100px] text-right">
                    {calculateDiscountAmount().toLocaleString()} บาท
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>กำไรขั้นต้น %</span>
                <span>0.00</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span>ยอดรวมก่อนภาษีมูลค่าเพิ่ม</span>
                  <span>{calculateAfterDiscount().toLocaleString()} บาท</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>ภาษีมูลค่าเพิ่ม {vatRate}%</span>
                <span>{calculateVat().toLocaleString()} บาท</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-lg">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="text-cyan-600">
                    {calculateGrandTotal().toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600">
              บันทึก
            </Button>
            <Button variant="outline" onClick={onCancel} className="text-red-500 border-red-500">
              ยกเลิก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
