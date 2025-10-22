import { useState, useEffect } from 'react';
import type { UserRole } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { companySettingService } from '../../services/companySettingService';
import { useCompanySettings } from '../../contexts/CompanySettingsContext';

interface SettingsPageProps {
  userRole: UserRole;
}

export default function SettingsPage({ userRole }: SettingsPageProps) {
  const { refreshSettings } = useCompanySettings();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [enableEmail, setEnableEmail] = useState(true);
  const [enableSMS, setEnableSMS] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [vatRate, setVatRate] = useState(7);

  // Load company settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await companySettingService.get();
      setCompanyName(settings.company_name);
      setBranchName(settings.branch_name || '');
      setTaxId(settings.tax_id);
      setVatNumber(settings.vat_number || '');
      setAddress(settings.address);
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setEnableEmail(settings.enable_email);
      setEnableSMS(settings.enable_sms);
      setAutoBackup(settings.auto_backup);
      setVatRate(Number(settings.vat_rate));
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    try {
      setLoading(true);
      await companySettingService.update({
        company_name: companyName,
        branch_name: branchName,
        tax_id: taxId,
        vat_number: vatNumber,
        address: address,
        phone: phone,
        email: email,
      });
      toast.success('บันทึกข้อมูลบริษัทสำเร็จ');
      await loadSettings();
      await refreshSettings(); // Refresh global context
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystem = async () => {
    try {
      setLoading(true);
      await companySettingService.update({
        company_name: companyName,
        branch_name: branchName,
        tax_id: taxId,
        vat_number: vatNumber,
        address: address,
        phone: phone,
        email: email,
        enable_email: enableEmail,
        enable_sms: enableSMS,
        auto_backup: autoBackup,
        vat_rate: vatRate,
      });
      toast.success('บันทึกการตั้งค่าระบบสำเร็จ');
      await loadSettings();
      await refreshSettings(); // Refresh global context
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>ไม่มีสิทธิ์เข้าถึง</CardTitle>
            <CardDescription>
              คุณไม่มีสิทธิ์เข้าถึงหน้าตั้งค่าระบบ กรุณาติดต่อผู้ดูแลระบบ
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company">ข้อมูลบริษัท</TabsTrigger>
          <TabsTrigger value="system">ตั้งค่าระบบ</TabsTrigger>
          <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลบริษัท</CardTitle>
              <CardDescription>จัดการข้อมูลบริษัทและรายละเอียดติดต่อ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">ชื่อบริษัท</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchName">ชื่อสาขา</Label>
                <Input
                  id="branchName"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="เช่น สำนักงานใหญ่, สาขา 1, ฯลฯ"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    maxLength={13}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">เลขทะเบียนภาษีมูลค่าเพิ่ม</Label>
                  <Input
                    id="vatNumber"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    maxLength={13}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่าระบบ</CardTitle>
              <CardDescription>กำหนดค่าการทำงานของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="enableEmail"
                  checked={enableEmail}
                  onCheckedChange={(checked) => setEnableEmail(checked === true)}
                  disabled={loading}
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="enableEmail" className="cursor-pointer">การแจ้งเตือนทางอีเมล</Label>
                  <p className="text-sm text-gray-500">
                    รับการแจ้งเตือนเกี่ยวกับเอกสารสำคัญทางอีเมล
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Checkbox
                  id="enableSMS"
                  checked={enableSMS}
                  onCheckedChange={(checked) => setEnableSMS(checked === true)}
                  disabled={loading}
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="enableSMS" className="cursor-pointer">การแจ้งเตือนทาง SMS</Label>
                  <p className="text-sm text-gray-500">
                    รับการแจ้งเตือนทาง SMS สำหรับรายการสำคัญ
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Checkbox
                  id="autoBackup"
                  checked={autoBackup}
                  onCheckedChange={(checked) => setAutoBackup(checked === true)}
                  disabled={loading}
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="autoBackup" className="cursor-pointer">สำรองข้อมูลอัตโนมัติ</Label>
                  <p className="text-sm text-gray-500">
                    ระบบจะสำรองข้อมูลอัตโนมัติทุกวันเวลา 00:00 น.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>อัตราภาษีมูลค่าเพิ่ม (%)</Label>
                <Input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  disabled={loading}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveSystem} disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>ความปลอดภัย</CardTitle>
              <CardDescription>จัดการการตั้งค่าความปลอดภัยของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                <Input id="confirmPassword" type="password" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>ระยะเวลาหมดอายุของเซสชัน (นาที)</Label>
                <Input type="number" defaultValue="30" />
                <p className="text-sm text-gray-500">
                  ระบบจะออกจากระบบอัตโนมัติหากไม่มีการใช้งานเกินระยะเวลาที่กำหนด
                </p>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline">ยกเลิก</Button>
                <Button onClick={() => toast.success('บันทึกการตั้งค่าความปลอดภัยสำเร็จ')}>
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
