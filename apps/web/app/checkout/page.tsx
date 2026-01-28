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
          className={`w-full px-4 py-3 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-medium transition-all ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-none shadow-xl max-h-60 overflow-auto">
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
                  String(option.code) === String(value) ? 'bg-primary text-white hover:bg-primary' : 'text-gray-700'
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

  // Load User Data & Addresses
  useEffect(() => {
    const initData = async () => {
       if (!user) return;

       const savedAddrStr = localStorage.getItem(`savedAddresses_${user.id}`);
       let loadedAddresses: any[] = [];

       if (savedAddrStr) {
          loadedAddresses = JSON.parse(savedAddrStr);
          setSavedAddresses(loadedAddresses);
       }

       if (loadedAddresses.length > 0) {
          const defaultAddr = loadedAddresses.find((a: any) => a.isDefault) || loadedAddresses[0];
          if (defaultAddr) {
             setSelectedAddressId(defaultAddr.id || defaultAddr._id);
             loadAddressToForm(defaultAddr);
             setIsEditingAddress(false);
             return;
          }
       } 
       
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
             setIsEditingAddress(true);
             return;
          } catch (e) { console.error(e); }
       }

       setCustomerInfo(prev => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
       }));
       setIsEditingAddress(true);
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
        if (!user || !user.id) {
           toast.error('Vui lòng đăng nhập lại');
           return;
        }

        const provinceName = provinces.find(p => p.code == +selectedProvince)?.name || '';
        const wardName = wards.find(w => w.code == +selectedWard)?.name || '';
        const fullAddress = `${streetAddress}, ${wardName}, ${provinceName}`;

        // Validate items
        const validItems = cart.map(item => ({
           productId: item.product._id || item.product.id,
           productName: item.product.name,
           productBrand: item.product.brand || 'N/A',
           productImage: item.product.image || '',
           price: item.selectedVariant?.price || item.product.price,
           quantity: item.quantity,
           variant: item.selectedVariant ? {
              name: item.selectedVariant.name,
              sku: item.selectedVariant.sku
           } : undefined
        })).filter(item => item.productId); // Filter out invalid items

        if (validItems.length === 0) {
           toast.error('Giỏ hàng lỗi: Sản phẩm không hợp lệ');
           return;
        }

        const orderData = {
           userId: user.id, // Ensure ID exists
           items: validItems,
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
           
           const data = await res.json();
           
           if (!res.ok) {
              throw new Error(data.message || 'Đặt hàng thất bại');
           }
           
           const orderId = data.order?._id || data.order?.id || data._id || data.id;
           
           clearCart();
           router.push(`/order-success?orderId=${orderId}`);
        } else {
           addOrder(orderData);
           clearCart();
           router.push('/order-success');
        }

     } catch (error: any) {
        console.error("Order Error:", error);
        toast.error(error.message || 'Có lỗi xảy ra');
     } finally {
        setIsProcessing(false);
     }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
       
       <div className="border-b border-gray-100 bg-white sticky top-0 z-20">
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <Link href="/" className="font-black text-xl italic tracking-tighter">FOOTMARK.</Link>
           <h1 className="font-bold text-sm uppercase tracking-widest text-gray-500">Thanh Toán An Toàn</h1>
         </div>
       </div>

       <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             
             <div className="lg:col-span-7 space-y-8">
                
                <section>
                   <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2 tracking-tighter">
                      <MapPin className="text-primary"/> 1. Thông tin giao hàng
                   </h2>
                   
                   {!isEditingAddress && savedAddresses.length > 0 ? (
                      <div className="bg-gray-50 rounded-none p-6 border border-gray-100 relative group">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="font-bold text-lg mb-1 italic uppercase tracking-tighter">{customerInfo.fullName} <span className="font-medium text-gray-500 text-sm ml-2">{customerInfo.phone}</span></p>
                               <p className="text-gray-600 leading-relaxed max-w-md text-sm font-medium">{streetAddress}, {wards.find(w => w.code == +selectedWard)?.name}, {provinces.find(p => p.code == +selectedProvince)?.name}</p>
                            </div>
                            <button onClick={() => setIsEditingAddress(true)} className="text-sm font-bold text-primary hover:underline uppercase tracking-widest">Thay đổi</button>
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
                                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                                  placeholder="Nguyễn Văn A"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại *</label>
                               <input 
                                  type="text" 
                                  value={customerInfo.phone}
                                  onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
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
                               className="w-full px-4 py-3 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
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
                               className="w-full px-4 py-3 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                               placeholder="Số nhà, tên đường, tòa nhà..."
                            />
                         </div>

                         <button onClick={saveAddress} className="bg-primary text-white px-8 py-3 rounded-none font-bold text-sm uppercase hover:bg-primary-dark transition tracking-widest">Lưu địa chỉ này</button>
                         {savedAddresses.length > 0 && (
                            <button onClick={() => setIsEditingAddress(false)} className="ml-4 text-gray-500 font-bold text-sm uppercase hover:text-black tracking-widest">Hủy</button>
                         )}
                      </div>
                   )}
                </section>

                <section>
                   <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2 tracking-tighter">
                      <CreditCard className="text-primary"/> 2. Phương thức thanh toán
                   </h2>
                   
                   <div className="space-y-3">
                      <label className={`flex items-center gap-4 p-5 border rounded-none cursor-pointer transition ${paymentMethod === 'cod' ? 'border-primary bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                         <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-primary focus:ring-primary"/>
                         <div className="flex-1">
                            <span className="font-bold block text-sm uppercase tracking-wide">Thanh toán khi nhận hàng (COD)</span>
                            <span className="text-xs text-gray-500 font-medium italic">Kiểm tra hàng trước khi thanh toán</span>
                         </div>
                         <Truck className="text-gray-400"/>
                      </label>

                      <label className={`flex items-center gap-4 p-5 border rounded-none cursor-pointer transition ${paymentMethod === 'banking' ? 'border-primary bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                         <input type="radio" name="payment" value="banking" checked={paymentMethod === 'banking'} onChange={() => setPaymentMethod('banking')} className="w-5 h-5 text-primary focus:ring-primary"/>
                         <div className="flex-1">
                            <span className="font-bold block text-sm uppercase tracking-wide">Chuyển khoản ngân hàng</span>
                            <span className="text-xs text-gray-500 font-medium italic">QR Code Techcombank/Vietcombank</span>
                         </div>
                         <CreditCard className="text-gray-400"/>
                      </label>
                   </div>
                </section>

                <section>
                   <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ghi chú đơn hàng (Tùy chọn)</h2>
                   <textarea 
                      value={customerInfo.notes}
                      onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-none focus:ring-2 focus:ring-primary outline-none font-medium text-sm resize-none h-24"
                      placeholder="VD: Giao hàng giờ hành chính..."
                   />
                </section>

             </div>

             <div className="lg:col-span-5">
                <div className="bg-gray-50 rounded-none p-8 sticky top-24 border border-gray-100">
                   <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2 tracking-tighter">
                      <ShoppingBag className="text-primary"/> Đơn hàng ({cart.length})
                   </h2>

                   <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map((item, idx) => (
                         <div key={idx} className="flex gap-4">
                            <div className="w-16 h-16 bg-white rounded-none overflow-hidden border border-gray-200 flex-shrink-0 relative">
                               <img src={item.selectedVariant?.image || item.product.image} alt="" className="w-full h-full object-cover"/>
                               <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-none shadow">{item.quantity}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-sm truncate uppercase tracking-tighter italic">{item.product.name}</h4>
                               {item.selectedVariant && (
                                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Size: <span className="text-primary">{item.selectedVariant.name}</span></p>
                               )}
                               <p className="text-sm font-black mt-1 text-black italic">
                                  {formatCurrency(item.selectedVariant?.price || item.product.price)}
                               </p>
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                         <span>Tạm tính:</span>
                         <span className="text-black font-black italic text-sm">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                         <span>Phí vận chuyển:</span>
                         <span className="text-green-600 font-black italic text-sm">{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
                      </div>
                      {discountAmount > 0 && (
                         <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-primary">
                            <span>Voucher giảm giá:</span>
                            <span className="font-black italic text-sm">-{formatCurrency(discountAmount)}</span>
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

                   <div className="border-t-2 border-black pt-6 flex justify-between items-end mb-8">
                      <span className="font-black text-xl uppercase italic tracking-tighter">Tổng cộng</span>
                      <div className="text-right">
                         <span className="block font-black text-3xl text-primary italic tracking-tighter leading-none">{formatCurrency(totalAmount)}</span>
                         <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 inline-block">(Đã bao gồm VAT)</span>
                      </div>
                   </div>

                   <button 
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="w-full bg-primary text-white py-4 rounded-none font-bold uppercase tracking-widest hover:bg-primary-dark transition shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                      {isProcessing ? 'Đang xử lý...' : 'Đặt hàng ngay'} <CheckCircle size={20}/>
                   </button>
                   
                   <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-6 flex items-center justify-center gap-1">
                      <Lock size={12}/> Thông tin được bảo mật tuyệt đối
                   </p>
                </div>
             </div>

          </div>
       </div>
    </div>
  );
}
