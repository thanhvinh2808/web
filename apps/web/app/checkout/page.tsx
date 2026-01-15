"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { ShoppingBag, CreditCard, Lock, User, Tag, CheckCircle, DiscAlbum, ChevronDown, X, MapPin, Truck, Package } from 'lucide-react';
import { VoucherSelector } from "../../components/VoucherSelector";
import { Voucher } from '../types/voucher';
import Link from 'next/link';
import toast from 'react-hot-toast';

// --- Helper: Xóa dấu tiếng Việt ---
function removeAccents(str: string) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

// --- Component: Autocomplete Select ---
interface Option {
  code: number | string;
  name: string;
}

interface AutocompleteSelectProps {
  label: string;
  value: string | number;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const AutocompleteSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Chọn...",
  disabled = false,
  required = false
}: AutocompleteSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const selectedOption = options.find(opt => String(opt.code) === String(value));
    if (selectedOption) {
      setQuery(selectedOption.name);
    } else if (!value) {
      setQuery('');
    }
  }, [value, options]);

  const filteredOptions = query === ''
    ? options
    : options.filter((opt) =>
        removeAccents(opt.name).includes(removeAccents(query))
      );

  const handleSelect = (code: string | number, name: string) => {
    onChange(String(code));
    setQuery(name);
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') onChange('');
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-medium transition-all ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
        
        {!disabled && query && isOpen && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Không tìm thấy kết quả
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.code}
                onMouseDown={() => handleSelect(option.code, option.name)}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors font-medium ${
                  String(option.code) === String(value) ? 'bg-black text-white hover:bg-black' : 'text-gray-700'
                }`}
              >
                {option.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface Province { name: string; code: number; districts: any[]; }
interface District { name: string; code: number; wards: any[]; }
interface Ward { name: string; code: number; }

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { addOrder, refreshOrders } = useOrders();
  
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  // Address State
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Voucher State
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 1000000 ? 0 : (subtotal >= 500000 ? 30000 : 50000);
  const vatAmount = Math.round(subtotal * 0.01); // Ví dụ VAT 1% (hoặc có thể bỏ nếu giá đã bao gồm VAT)
  
  // Calculate discount
  useEffect(() => {
     if (selectedVoucher) {
        if (selectedVoucher.discountType === 'percentage') {
           const discount = (subtotal * selectedVoucher.discountValue) / 100;
           setDiscountAmount(selectedVoucher.maxDiscount ? Math.min(discount, selectedVoucher.maxDiscount) : discount);
        } else {
           setDiscountAmount(selectedVoucher.discountValue);
        }
     } else {
        setDiscountAmount(0);
     }
  }, [selectedVoucher, subtotal]);

  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  // Redirect Logic
  useEffect(() => {
    if (cart && cart.length === 0) router.push('/cart');
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      router.push('/login');
    }
  }, [cart, isAuthenticated, router]);

  // Load User Data & Addresses (FIXED LOGIC)
  useEffect(() => {
    const initData = async () => {
       if (!user) return;

       // 1. Load Saved Addresses (Ưu tiên cao nhất)
       const savedAddrStr = localStorage.getItem(`savedAddresses_${user.id}`);
       let loadedAddresses: any[] = [];

       if (savedAddrStr) {
          loadedAddresses = JSON.parse(savedAddrStr);
          setSavedAddresses(loadedAddresses);
       } else {
          // Nếu local chưa có, thử fetch từ API (Optional, nếu API có endpoint get addresses riêng)
          // Hiện tại giả sử savedAddresses đã được sync khi login hoặc từ profile
       }

       // 2. Quyết định điền form
       if (loadedAddresses.length > 0) {
          // ✅ Case A: User có địa chỉ đã lưu -> Load Default
          const defaultAddr = loadedAddresses.find((a: any) => a.isDefault) || loadedAddresses[0];
          if (defaultAddr) {
             setSelectedAddressId(defaultAddr.id || defaultAddr._id);
             loadAddressToForm(defaultAddr);
             setIsEditingAddress(false); // Ở chế độ xem, không phải sửa
             return;
          }
       } 
       
       // ✅ Case B: User chưa có địa chỉ lưu -> Check Temporary Info (Lần nhập trước chưa lưu)
       const tempInfo = localStorage.getItem('defaultShippingInfo');
       if (tempInfo) {
          try {
             const parsed = JSON.parse(tempInfo);
             setCustomerInfo({
                fullName: parsed.fullName || user.name || '',
                email: parsed.email || user.email || '',
                phone: parsed.phone || user.phone || '',
                address: parsed.address || '',
                city: parsed.city || '',
                district: '',
                ward: parsed.ward || '',
                notes: parsed.notes || ''
             });
             setStreetAddress(parsed.address || '');
             // Cần trigger logic tìm Province/Ward code từ tên (Auto-map effect ở dưới sẽ lo việc này)
             setIsEditingAddress(true); // Mở form để user check lại
             return;
          } catch (e) { console.error(e); }
       }

       // ✅ Case C: User mới tinh -> Load basic info
       setCustomerInfo(prev => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
       }));
       setIsEditingAddress(true); // Mở form để nhập mới
    };

    initData();
  }, [user]);

  // Fetch Provinces
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch Wards when Province selected
  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=3`)
        .then(res => res.json())
        .then(data => {
           const allWards: any[] = [];
           if (data.districts) {
              data.districts.forEach((dist: any) => {
                 if (dist.wards) {
                    allWards.push(...dist.wards.map((w: any) => ({
                       ...w,
                       name: `${w.name} (${dist.name})`
                    })));
                 }
              });
           }
           setWards(allWards);
        })
        .catch(err => console.error(err));
    } else {
       setWards([]);
    }
  }, [selectedProvince]);

  const loadAddressToForm = (addr: any) => {
     setCustomerInfo({
        fullName: addr.name || addr.fullName,
        email: addr.email || user?.email || '',
        phone: addr.phone,
        address: addr.streetAddress || addr.address,
        city: addr.city,
        district: '',
        ward: addr.ward,
        notes: ''
     });
     setStreetAddress(addr.streetAddress || addr.address);
     setSelectedProvince(addr.provinceCode || '');
     setSelectedWard(addr.wardCode || '');
     setIsEditingAddress(false);
  };

  const saveAddress = () => {
     if (!streetAddress || !selectedProvince || !selectedWard || !customerInfo.fullName || !customerInfo.phone) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
     }

     const provinceName = provinces.find(p => p.code == +selectedProvince)?.name || '';
     const wardName = wards.find(w => w.code == +selectedWard)?.name || '';

     const newAddr = {
        id: Date.now().toString(),
        fullName: customerInfo.fullName,
        phone: customerInfo.phone,
        email: customerInfo.email,
        streetAddress,
        city: provinceName,
        ward: wardName,
        provinceCode: selectedProvince,
        wardCode: selectedWard,
        isDefault: savedAddresses.length === 0
     };

     const updatedAddrs = [...savedAddresses, newAddr];
     setSavedAddresses(updatedAddrs);
     localStorage.setItem(`savedAddresses_${user?.id}`, JSON.stringify(updatedAddrs));
     loadAddressToForm(newAddr);
     toast.success('Đã lưu địa chỉ mới');
  };

  const handleSubmit = async () => {
     if (!customerInfo.fullName || !customerInfo.phone || !streetAddress || !selectedProvince || !selectedWard) {
        toast.error('Vui lòng kiểm tra lại thông tin giao hàng');
        return;
     }

     setIsProcessing(true);
     try {
        const provinceName = provinces.find(p => p.code == +selectedProvince)?.name || '';
        const wardName = wards.find(w => w.code == +selectedWard)?.name || '';
        const fullAddress = `${streetAddress}, ${wardName}, ${provinceName}`;

        const orderData = {
           userId: user?.id,
           items: cart.map(item => ({
              productId: item.product._id || item.product.id || '',
              productName: item.product.name,
              productBrand: item.product.brand || 'N/A',
              productImage: item.product.image || '',
              price: item.selectedVariant?.price || item.product.price,
              quantity: item.quantity,
              variant: item.selectedVariant ? {
                 name: item.selectedVariant.name,
                 sku: item.selectedVariant.sku
              } : undefined
           })),
           customerInfo: {
              ...customerInfo,
              address: fullAddress,
              city: provinceName,
              ward: wardName
           },
           paymentMethod: paymentMethod as 'cod' | 'banking' | 'momo' | 'card',
           totalAmount,
           shippingFee,
           discountAmount,
           voucherCode: selectedVoucher?.code || null,
           status: 'pending' as const,
           paymentStatus: (paymentMethod === 'cod' ? 'unpaid' : 'paid') as 'paid' | 'unpaid'
        };

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem('token');

        if (API_URL && token) {
           const res = await fetch(`${API_URL}/api/orders`, {
              method: 'POST',
              headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(orderData)
           });
           
           if (!res.ok) throw new Error('Đặt hàng thất bại');
           const data = await res.json();
           const orderId = data._id || data.id;
           
           clearCart();
           router.push(`/order-success?orderId=${orderId}`);
        } else {
           // Local fallback
           addOrder(orderData);
           clearCart();
           router.push('/order-success');
        }

     } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Có lỗi xảy ra');
     } finally {
        setIsProcessing(false);
     }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
       
       {/* Header */}
       <div className="border-b border-gray-100 bg-white sticky top-0 z-20">
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <Link href="/" className="font-black text-xl italic tracking-tighter">FOOTMARK.</Link>
           <h1 className="font-bold text-sm uppercase tracking-widest text-gray-500">Thanh Toán An Toàn</h1>
         </div>
       </div>

       <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             
             {/* LEFT COLUMN: INFO & PAYMENT */}
             <div className="lg:col-span-7 space-y-8">
                
                {/* 1. Thông tin giao hàng */}
                <section>
                   <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
                      <MapPin className="text-black"/> 1. Thông tin giao hàng
                   </h2>
                   
                   {!isEditingAddress && savedAddresses.length > 0 ? (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 relative group">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="font-bold text-lg mb-1">{customerInfo.fullName} <span className="font-normal text-gray-500 text-sm ml-2">{customerInfo.phone}</span></p>
                               <p className="text-gray-600 leading-relaxed max-w-md">{streetAddress}, {wards.find(w => w.code == +selectedWard)?.name}, {provinces.find(p => p.code == +selectedProvince)?.name}</p>
                            </div>
                            <button onClick={() => setIsEditingAddress(true)} className="text-sm font-bold text-blue-600 hover:underline">Thay đổi</button>
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-4 animate-fade-in-up">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Họ và tên *</label>
                               <input 
                                  type="text" 
                                  value={customerInfo.fullName}
                                  onChange={e => setCustomerInfo({...customerInfo, fullName: e.target.value})}
                                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
                                  placeholder="Nguyễn Văn A"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại *</label>
                               <input 
                                  type="text" 
                                  value={customerInfo.phone}
                                  onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
                                  placeholder="0987..."
                               />
                            </div>
                         </div>
                         
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                            <input 
                               type="email" 
                               value={customerInfo.email}
                               onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                               className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
                               placeholder="email@example.com"
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <AutocompleteSelect 
                               label="Tỉnh / Thành phố"
                               value={selectedProvince}
                               options={provinces.map(p => ({ code: p.code, name: p.name }))}
                               onChange={setSelectedProvince}
                               placeholder="Chọn tỉnh..."
                               required
                            />
                            <AutocompleteSelect 
                               label="Phường / Xã"
                               value={selectedWard}
                               options={wards.map(w => ({ code: w.code, name: w.name }))}
                               onChange={setSelectedWard}
                               placeholder="Chọn phường/xã..."
                               disabled={!selectedProvince}
                               required
                            />
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Địa chỉ cụ thể *</label>
                            <input 
                               type="text" 
                               value={streetAddress}
                               onChange={e => setStreetAddress(e.target.value)}
                               className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
                               placeholder="Số nhà, tên đường, tòa nhà..."
                            />
                         </div>

                         <button onClick={saveAddress} className="bg-black text-white px-6 py-2 rounded-lg font-bold text-sm uppercase hover:bg-stone-800">Lưu địa chỉ này</button>
                         {savedAddresses.length > 0 && (
                            <button onClick={() => setIsEditingAddress(false)} className="ml-4 text-gray-500 font-bold text-sm uppercase hover:text-black">Hủy</button>
                         )}
                      </div>
                   )}
                </section>

                {/* 2. Phương thức thanh toán */}
                <section>
                   <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
                      <CreditCard className="text-black"/> 2. Phương thức thanh toán
                   </h2>
                   
                   <div className="space-y-3">
                      <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'cod' ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                         <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-black focus:ring-black"/>
                         <div className="flex-1">
                            <span className="font-bold block">Thanh toán khi nhận hàng (COD)</span>
                            <span className="text-sm text-gray-500">Kiểm tra hàng trước khi thanh toán</span>
                         </div>
                         <Truck className="text-gray-400"/>
                      </label>

                      <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'banking' ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                         <input type="radio" name="payment" value="banking" checked={paymentMethod === 'banking'} onChange={() => setPaymentMethod('banking')} className="w-5 h-5 text-black focus:ring-black"/>
                         <div className="flex-1">
                            <span className="font-bold block">Chuyển khoản ngân hàng</span>
                            <span className="text-sm text-gray-500">QR Code Techcombank/Vietcombank</span>
                         </div>
                         <CreditCard className="text-gray-400"/>
                      </label>
                   </div>
                </section>

                {/* Ghi chú */}
                <section>
                   <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Ghi chú đơn hàng (Tùy chọn)</h2>
                   <textarea 
                      value={customerInfo.notes}
                      onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black outline-none font-medium resize-none h-24"
                      placeholder="VD: Giao hàng giờ hành chính..."
                   />
                </section>

             </div>

             {/* RIGHT COLUMN: ORDER SUMMARY */}
             <div className="lg:col-span-5">
                <div className="bg-gray-50 rounded-2xl p-8 sticky top-24 border border-gray-100">
                   <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
                      <ShoppingBag className="text-black"/> Đơn hàng ({cart.length})
                   </h2>

                   <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map((item, idx) => (
                         <div key={idx} className="flex gap-4">
                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 relative">
                               <img src={item.selectedVariant?.image || item.product.image} alt="" className="w-full h-full object-cover"/>
                               <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">{item.quantity}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                               {item.selectedVariant && (
                                  <p className="text-xs text-gray-500 mt-0.5">Size: <span className="font-bold text-black">{item.selectedVariant.name}</span></p>
                               )}
                               <p className="text-sm font-bold mt-1 text-black">
                                  {formatCurrency(item.selectedVariant?.price || item.product.price)}
                               </p>
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                      <div className="flex justify-between text-sm text-gray-600">
                         <span>Tạm tính:</span>
                         <span className="font-bold text-black">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                         <span>Phí vận chuyển:</span>
                         <span className="font-bold text-green-600">{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
                      </div>
                      {discountAmount > 0 && (
                         <div className="flex justify-between text-sm text-blue-600">
                            <span>Voucher giảm giá:</span>
                            <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                         </div>
                      )}
                   </div>

                   <div className="mb-6">
                      <VoucherSelector 
                         totalAmount={subtotal} 
                         onVoucherApply={(v) => setSelectedVoucher(v)} 
                         selectedVoucher={selectedVoucher}
                      />
                   </div>

                   <div className="border-t border-black pt-4 flex justify-between items-end mb-8">
                      <span className="font-black text-xl uppercase">Tổng cộng</span>
                      <div className="text-right">
                         <span className="block font-black text-3xl">{formatCurrency(totalAmount)}</span>
                         <span className="text-xs text-gray-500">(Đã bao gồm VAT)</span>
                      </div>
                   </div>

                   <button 
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-stone-800 transition shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                      {isProcessing ? 'Đang xử lý...' : 'Đặt hàng ngay'} <CheckCircle size={20}/>
                   </button>
                   
                   <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                      <Lock size={12}/> Thông tin được bảo mật tuyệt đối
                   </p>
                </div>
             </div>

          </div>
       </div>
    </div>
  );
}