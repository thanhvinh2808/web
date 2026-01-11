"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { ShoppingCart, CreditCard, Lock, User, Tag, CheckCircle, DiscAlbum, ChevronDown, X } from 'lucide-react';
import { VoucherSelector } from "../../components/VoucherSelector";
import { Voucher } from '../types/voucher';
import { MapPin, Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Helper: Xóa dấu tiếng Việt để tìm kiếm ---
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
  const wrapperRef = useState<HTMLDivElement | null>(null);

  // Sync value prop với input display
  useEffect(() => {
    const selectedOption = options.find(opt => String(opt.code) === String(value));
    if (selectedOption) {
      setQuery(selectedOption.name);
    } else if (!value) {
      setQuery('');
    }
  }, [value, options]);

  // Filter options
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
    <div className="relative">
      <label className="block text-sm text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            // Nếu người dùng xóa hết, reset value
            if (e.target.value === '') onChange('');
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          // Delay blur để click sự kiện kịp bắt
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border ${
            isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'
          } rounded outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500 transition-all`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
        
        {/* Nút xóa text (chỉ hiện khi có text và đang active) */}
        {!disabled && query && isOpen && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Ngăn blur
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

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Không tìm thấy kết quả
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.code}
                onMouseDown={() => handleSelect(option.code, option.name)} // Dùng onMouseDown để chạy trước onBlur của input
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors ${
                  String(option.code) === String(value) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
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
// --- Định nghĩa Type cho API Địa chỉ ---
interface Province {
  name: string;
  code: number;
  districts: any[];
}
interface District {
  name: string;
  code: number;
  wards: any[];
}
interface Ward {
  name: string;
  code: number;
}

export default function CheckoutPage() {
  const {orders} = useOrders();
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
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // --- State cho Địa chỉ ---
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressList, setShowAddressList] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // --- State cho Voucher ---
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // ✅ Tính tạm tính
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const vatAmount = Math.round(subtotal * 0.01);

  // ✅ Tính phí vận chuyển
  const calculateShippingFee = () => {
    if (subtotal >= 1000000) return 0;
    if (subtotal >= 500000) return 30000;
    return 50000;
  };
  const shippingFee = calculateShippingFee();

  // ✅ Tính tổng tiền cuối cùng
  const totalAmount = subtotal + vatAmount + shippingFee - discountAmount;

  // ✅ Redirect nếu giỏ hàng trống
  useEffect(() => {
    if (cart && cart.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  // ✅ Redirect đến login nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/api/checkout');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // ✅ TỰ ĐỘNG ĐIỀN THÔNG TIN TỪ API USER PROFILE HOẶC LOCALSTORAGE
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (typeof window === 'undefined') return;
      
      const savedShippingInfo = localStorage.getItem('defaultShippingInfo');
      // Nếu đã có thông tin ship tạm lưu, ưu tiên dùng nó
      if (savedShippingInfo) {
        try {
          const parsedInfo = JSON.parse(savedShippingInfo);
          setCustomerInfo({
            fullName: parsedInfo.fullName || '',
            email: parsedInfo.email || '',
            phone: parsedInfo.phone || '',
            address: parsedInfo.address || '',
            city: parsedInfo.city || '',
            district: parsedInfo.district || '',
            ward: parsedInfo.ward || '',
            notes: parsedInfo.notes || ''
          });
          setStreetAddress(parsedInfo.address || '');
          setIsAutoFilled(true);
          return; // Đã có thông tin, không cần fetch profile
        } catch (error) {
          console.error('Error parsing saved shipping info:', error);
        }
      }

      // Nếu chưa có savedShippingInfo, gọi API lấy profile mới nhất
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          // Điền thông tin từ profile mới nhất
          setCustomerInfo({
            fullName: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            district: userData.district || '',
            ward: userData.ward || '',
            notes: '',
          });
          // Nếu có địa chỉ cụ thể, set vào streetAddress
          if (userData.address) {
            setStreetAddress(userData.address);
          }

          // ✅ Sync savedAddresses from backend
          if (userData.addresses && Array.isArray(userData.addresses) && userData.addresses.length > 0) {
             setSavedAddresses(userData.addresses);
             // Tìm default
             const defaultAddr = userData.addresses.find((a: any) => a.isDefault);
             if (defaultAddr) {
                 setSelectedAddressId(defaultAddr._id || defaultAddr.id);
                 loadAddressToForm(defaultAddr);
                 setIsAutoFilled(true);
             }
          }
          
          // Lưu ý: Việc map City/District/Ward từ tên (string) sang Code (number) cho dropdown
          // là rất khó nếu không có dữ liệu map chuẩn. 
          // Ở đây ta chỉ hiển thị text, user có thể cần chọn lại dropdown nếu muốn chỉnh sửa chính xác.
        }
      } catch (error) {
        console.error('Error fetching user profile for checkout:', error);
        // Fallback về user từ context
        if (user) {
          setCustomerInfo({
            fullName: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            district: user.district || '',
            ward: user.ward || '',
            notes: user.notes || '',
          });
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Load danh sách địa chỉ đã lưu
  // ✅ Load danh sách địa chỉ đã lưu + Tự động điền địa chỉ mặc định
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const savedAddressesStr = localStorage.getItem(`savedAddresses_${user.id}`);
      
      if (savedAddressesStr) {
        try {
          const addresses = JSON.parse(savedAddressesStr);
          setSavedAddresses(addresses);
          
          // Tìm địa chỉ mặc định hoặc địa chỉ đầu tiên
          const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
          
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            loadAddressToForm(defaultAddress);
            setIsAutoFilled(true);
          }
        } catch (error) {
          console.error('Error loading saved addresses:', error);
        }
      } else {
        // Nếu chưa có địa chỉ nào, điền thông tin cơ bản từ user
        setCustomerInfo({
          fullName: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: '',
          city: '',
          district: '',
          ward: '',
          notes: '',
        });
      }
    }
  }, [user]);

  // Hàm load địa chỉ vào form
  const loadAddressToForm = async (address: any) => {
    setCustomerInfo({
      fullName: address.name || address.fullName,
      email: address.email,
      phone: address.phone,
      address: address.streetAddress || address.address, // Hỗ trợ cả 2 tên field
      city: address.city,
      district: '', // Bỏ qua district
      ward: address.ward,
      notes: address.notes || ''
    });
    setStreetAddress(address.streetAddress || address.address);
    
    // Load Province
    setSelectedProvince(address.provinceCode || '');
    
    // Load Wards trực tiếp từ Province (Bỏ qua bước load District)
    if (address.provinceCode) {
      try {
        // Gọi API depth=3 giống như khi chọn tỉnh
        const response = await fetch(`https://provinces.open-api.vn/api/p/${address.provinceCode}?depth=3`);
        const data = await response.json();
        
        const allWards: any[] = [];
        if (data.districts && Array.isArray(data.districts)) {
          data.districts.forEach((dist: any) => {
            if (dist.wards && Array.isArray(dist.wards)) {
              // Thêm tên quận/huyện vào tên xã
              const wardsWithDistrict = dist.wards.map((w: any) => ({
                ...w,
                name: `${w.name} (${dist.name})`
              }));
              allWards.push(...wardsWithDistrict);
            }
          });
        }
        
        setWards(allWards);
        setSelectedWard(address.wardCode || '');
        
      } catch (error) {
        console.error('Error loading address data:', error);
      }
    }
  };

   // ✅ Hàm lưu địa chỉ MỚI (cải tiến + Sync Backend)
   const saveAddress = async () => {
     if (!streetAddress || !selectedProvince || !selectedWard) {
       toast.success('Vui lòng điền đầy đủ thông tin địa chỉ');
       return;
     }
 
     if (!customerInfo.fullName || !customerInfo.phone) {
       toast.success('Vui lòng điền họ tên và số điện thoại');
       return;
     }
 
     const provinceName = provinces.find(p => p.code == +selectedProvince)?.name || '';
     const districtName = '';
     const wardName = wards.find(w => w.code == +selectedWard)?.name || '';
 
     const newAddress = {
       name: customerInfo.fullName, // Backend expects 'name'
       fullName: customerInfo.fullName, // Local uses 'fullName'
       phone: customerInfo.phone,
       email: customerInfo.email,
       streetAddress: streetAddress,
       address: streetAddress, // Backend expects 'address'
       city: provinceName,
       district: districtName,
       ward: wardName,
       provinceCode: selectedProvince,
       districtCode: '', 
       wardCode: selectedWard,
       isDefault: savedAddresses.length === 0,
     };
 
     try {
         // Gọi API lưu vào backend
         if (isAuthenticated) {
             const token = localStorage.getItem('token');
             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/addresses`, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify(newAddress)
             });
             
             if (res.ok) {
                 const data = await res.json();
                 // Backend returns updated list
                 setSavedAddresses(data.addresses);
                 
                 // Set selected to new one (last one usually)
                 const added = data.addresses[data.addresses.length - 1];
                 if(added) setSelectedAddressId(added._id);
                 
                 localStorage.setItem(`savedAddresses_${user?.id}`, JSON.stringify(data.addresses));
                 toast.success('✅ Đã lưu địa chỉ vào hồ sơ!');
             } else {
                  // Fallback local if API fails
                  console.warn("Failed to save address to backend, saving locally");
                  const localAddr = { ...newAddress, id: Date.now().toString() };
                  const updatedAddresses = [...savedAddresses, localAddr];
                  setSavedAddresses(updatedAddresses);
                  localStorage.setItem(`savedAddresses_${user?.id}`, JSON.stringify(updatedAddresses));
                  setSelectedAddressId(localAddr.id);
             }
         } else {
             // Guest mode
              const localAddr = { ...newAddress, id: Date.now().toString() };
              const updatedAddresses = [...savedAddresses, localAddr];
              setSavedAddresses(updatedAddresses);
              setSelectedAddressId(localAddr.id);
         }
     } catch (e) {
         console.error("Error saving address:", e);
     }
     
     setIsEditingAddress(false);
   };
  // Hàm cập nhật địa chỉ mặc định
  const updateDefaultAddress = (addressId: string) => {
    const updatedAddresses = savedAddresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    setSavedAddresses(updatedAddresses);
    localStorage.setItem(`savedAddresses_${user?.id}`, JSON.stringify(updatedAddresses));
  };

  // ✅ Hàm xóa địa chỉ (Sync Backend)
  const deleteAddress = async (addressId: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    try {
        if (isAuthenticated) {
             const token = localStorage.getItem('token');
             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/addresses/${addressId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                 const data = await res.json();
                 setSavedAddresses(data.addresses);
                 localStorage.setItem(`savedAddresses_${user?.id}`, JSON.stringify(data.addresses));
                 toast.success('Đã xóa địa chỉ');
                 
                 // Reset selection if needed
                 if (selectedAddressId === addressId && data.addresses.length > 0) {
                    setSelectedAddressId(data.addresses[0]._id);
                    loadAddressToForm(data.addresses[0]);
                 }
            } else {
                toast.error('Không thể xóa địa chỉ');
            }
        } else {
            // Local delete
             const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
            if (updatedAddresses.length > 0) {
              const deletedWasDefault = savedAddresses.find(a => a.id === addressId)?.isDefault;
              if (deletedWasDefault) {
                updatedAddresses[0].isDefault = true;
              }
            }
            setSavedAddresses(updatedAddresses);
            localStorage.setItem(`savedAddresses_${user?.id}`, JSON.stringify(updatedAddresses));
             if (selectedAddressId === addressId && updatedAddresses.length > 0) {
                loadAddressToForm(updatedAddresses[0]);
                setSelectedAddressId(updatedAddresses[0].id);
            }
        }
    } catch (e) {
        console.error("Error deleting address:", e);
    }
  };
  // ✅ Tải danh sách Tỉnh/Thành phố
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/p/');
        if (!response.ok) throw new Error('Failed to fetch provinces');
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách tỉnh/thành:", error);
      }
    };
    fetchProvinces();
  }, []);

  // ✅ Tải danh sách Xã/Phường ngay khi chọn Tỉnh (Bỏ qua Huyện)
  useEffect(() => {
    const fetchWardsByProvince = async () => {
      if (selectedProvince) {
        try {
          // Gọi API với depth=3 để lấy cấu trúc Tỉnh -> Huyện -> Xã
          const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=3`);
          if (!response.ok) throw new Error('Failed to fetch province details');
          const data = await response.json();
          
          // data.districts chứa danh sách huyện, mỗi huyện có districts.wards
          // Ta gộp tất cả wards của tất cả districts lại thành 1 mảng
          const allWards: any[] = [];
          if (data.districts && Array.isArray(data.districts)) {
            data.districts.forEach((dist: any) => {
              if (dist.wards && Array.isArray(dist.wards)) {
                // Thêm tên quận/huyện vào tên xã để dễ phân biệt (Tùy chọn, giúp UX tốt hơn)
                const wardsWithDistrict = dist.wards.map((w: any) => ({
                  ...w,
                  name: `${w.name} (${dist.name})` // Ví dụ: Phường 1 (Quận 1)
                }));
                allWards.push(...wardsWithDistrict);
              }
            });
          }
          
          setWards(allWards);
        } catch (error) {
          console.error("Lỗi khi tải danh sách phường/xã:", error);
          setWards([]);
        }
      } else {
        setWards([]);
      }
    };
    
    fetchWardsByProvince();
    setSelectedWard('');
  }, [selectedProvince]);

  // ✅ AUTO-MAP: Tự động chọn Tỉnh dựa trên Tên Tỉnh (từ Profile)
  useEffect(() => {
    if (customerInfo.city && provinces.length > 0 && !selectedProvince) {
      // Chuẩn hóa tên để so sánh (bỏ dấu, thường)
      const normalize = (str: string) => removeAccents(str).trim();
      const targetCity = normalize(customerInfo.city);

      const foundProvince = provinces.find(p => normalize(p.name) === targetCity);
      
      if (foundProvince) {
        console.log(`📍 Auto-selected Province: ${foundProvince.name} (${foundProvince.code})`);
        setSelectedProvince(String(foundProvince.code));
      }
    }
  }, [customerInfo.city, provinces]);

  // ✅ AUTO-MAP: Tự động chọn Xã dựa trên Tên Xã (từ Profile)
  useEffect(() => {
    if (customerInfo.ward && wards.length > 0 && !selectedWard) {
      const normalize = (str: string) => removeAccents(str).trim();
      const targetWard = normalize(customerInfo.ward);

      // Tìm xã khớp tên (ưu tiên khớp chính xác hoặc bắt đầu bằng)
      const foundWard = wards.find(w => {
        const currentWard = normalize(w.name.split(' (')[0]); // Bỏ phần tên quận trong ngoặc nếu có
        return currentWard === targetWard || targetWard.includes(currentWard);
      });

      if (foundWard) {
        console.log(`📍 Auto-selected Ward: ${foundWard.name} (${foundWard.code})`);
        setSelectedWard(String(foundWard.code));
      }
    }
  }, [customerInfo.ward, wards]);

  // ✅ Hàm tính giảm giá
  const calculateDiscount = (voucher: Voucher | null): number => {
    if (!voucher) return 0;
    
    const amount = subtotal;
    
    if (voucher.discountType === 'percentage') {
      const discount = (amount * voucher.discountValue) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
    
    return voucher.discountValue;
  };

  // ✅ Handler cho voucher
  const handleVoucherApply = (voucher: Voucher | null) => {
    setSelectedVoucher(voucher);
    setDiscountAmount(calculateDiscount(voucher));
  };

  // ✅ SUBMIT FORM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!streetAddress || !selectedProvince || !selectedWard) {
      toast.success('Vui lòng điền đầy đủ thông tin địa chỉ (Số nhà, Tỉnh, Xã).');
      return;
    }

    const provinceName = provinces.find(p => p.code == +selectedProvince)?.name || '';
    // District bỏ trống
    const districtName = ''; 
    const wardName = wards.find(w => w.code == +selectedWard)?.name || '';
    const fullAddress = `${streetAddress}, ${wardName}, ${provinceName}`;

    setIsProcessing(true);

    try {
      if (typeof window !== 'undefined') {
        const shippingInfo = {
          fullName: customerInfo.fullName,
          phone: customerInfo.phone,
          email: customerInfo.email,
          address: streetAddress,
          city: provinceName,
          district: '',
          ward: wardName
        };
        localStorage.setItem('defaultShippingInfo', JSON.stringify(shippingInfo));
      }

      const orderData = {
        items: cart.map(item => ({
          productId: item.product._id || item.product.id,
          productName: item.product.name,
          productBrand: item.product.brand,
          productImage: item.product.image,
          price: item.product.price,
          quantity: item.quantity
        })),
        customerInfo: {
          ...customerInfo,
          address: fullAddress,
          city: provinceName,
          district: '', // Bỏ trống
          ward: wardName
        },
        paymentMethod,
        totalAmount: totalAmount,
        shippingFee: shippingFee,
        discountAmount: discountAmount,
        voucherCode: selectedVoucher?.code || null,
        status: 'pending',
        isPaid: paymentMethod !== 'cod',
        paymentStatus: paymentMethod !== 'cod' ? 'paid' : 'unpaid',
        userId: user?.id,
        updatedAt: new Date().toISOString()
      };

      console.log('Order data:', orderData);

      let finalOrder;
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      if (API_URL) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (!token) {
          throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        }

        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Lỗi khi gọi API đặt hàng');
        }
        
        finalOrder = await response.json();
        await refreshOrders();
        
      } else {
        console.warn("API_URL không được cấu hình. Sử dụng local context.");
        finalOrder = addOrder(orderData);
      }
      
      clearCart();
      
      const orderId = finalOrder._id || finalOrder.id;
      router.push(`/order-success?orderId=${orderId}`);

    } catch (error: any) {
      console.error('Order error:', error);
      toast.success(`${error.message}. Vui lòng thử lại!`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Lock size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
        <p className="text-gray-600 mb-6">Bạn cần đăng nhập để tiếp tục thanh toán</p>
        <button
          onClick={() => router.push('/api/login')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Địa chỉ giao hàng */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  Địa Chỉ Nhận Hàng
                </h2>
              </div>

              <div className="p-4">
                {!isEditingAddress && savedAddresses.length > 0 ? (
                  // Hiển thị địa chỉ hiện tại
                  <div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{customerInfo.fullName}</span>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-600">{customerInfo.phone}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {customerInfo.address}, {customerInfo.ward}, {customerInfo.district}, {customerInfo.city}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setShowAddressList(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Chọn địa chỉ khác
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Cập nhật
                        </button>
                      </div>
                    </div>

                    {/* Modal danh sách địa chỉ */}
                    {showAddressList && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold">Chọn địa chỉ giao hàng</h3>
                            <button
                              onClick={() => setShowAddressList(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="p-4 space-y-3">
                            {savedAddresses.map((address) => (
                              <label
                                key={address.id}
                                className={`flex gap-3 p-4 border rounded-lg cursor-pointer transition ${
                                  selectedAddressId === address.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="savedAddress"
                                  checked={selectedAddressId === address.id}
                                  onChange={() => {
                                    setSelectedAddressId(address.id);
                                    loadAddressToForm(address);
                                    updateDefaultAddress(address.id);
                                    setShowAddressList(false);
                                  }}
                                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900">{address.name || address.fullName}</span>
                                    <span className="text-gray-500">|</span>
                                    <span className="text-gray-600">{address.phone}</span>
                                    {address.isDefault && (
                                      <span className="px-2 py-0.5 text-xs border border-blue-500 text-blue-500 rounded">
                                        Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {address.streetAddress || address.address}, {address.ward}, {address.district}, {address.city}
                                  </p>
                                </div>
                              </label>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingAddress(true);
                                setShowAddressList(false);
                                setStreetAddress('');
                                setSelectedProvince('');
                                setSelectedDistrict('');
                                setSelectedWard('');
                              }}
                              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition"
                            >
                              + Thêm địa chỉ mới
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Form chỉnh sửa/thêm địa chỉ
                  <div className="space-y-4">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingAddress(false);
                          const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
                          if (defaultAddr) loadAddressToForm(defaultAddr);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Quay lại
                      </button>
                    )}

                    {/* Họ tên và SĐT - 2 cột */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.fullName}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="0123456789"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="example@email.com"
                        required
                      />
                    </div>

                    {/* Tỉnh/Huyện/Xã - Sử dụng Autocomplete */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <AutocompleteSelect
                          label="Tỉnh/Thành phố"
                          required
                          value={selectedProvince}
                          options={provinces.map(p => ({ code: p.code, name: p.name }))}
                          onChange={(val) => setSelectedProvince(val)}
                          placeholder="Nhập tỉnh/thành..."
                        />
                      </div>
                      
                      <div>
                        <AutocompleteSelect
                          label="Phường/Xã"
                          required
                          value={selectedWard}
                          options={wards.map(w => ({ code: w.code, name: w.name }))}
                          onChange={(val) => setSelectedWard(val)}
                          disabled={!selectedProvince}
                          placeholder={!selectedProvince ? "Chọn Tỉnh trước..." : "Nhập phường/xã..."}
                        />
                      </div>
                    </div>

                    {/* Địa chỉ cụ thể */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">
                        Địa chỉ cụ thể <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Số nhà, tên đường"
                        required
                      />
                    </div>
{/* Nút lưu địa chỉ */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={saveAddress}
                        className="px-6 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        Lưu địa chỉ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" />
                  Phương thức thanh toán
                </h2>
              </div>
              
              <div className="p-4 space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</div>
                    <div className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="banking"
                    checked={paymentMethod === 'banking'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Chuyển khoản ngân hàng</div>
                    <div className="text-sm text-gray-500">Thanh toán trước</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Ví MoMo</div>
                    <div className="text-sm text-red-600 font-semibold">ƯU ĐÃI TỚI 40%</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-4">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Package size={18} className="text-green-500" />
                  Đơn hàng ({cart.length} sản phẩm)
                </h2>
              </div>

              <div className="p-4">
                {/* Danh sách sản phẩm */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.id || item.product._id} className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </div>
                      
                    </div>
                    
                  ))}
                </div>
               {/* ghi chú */}
<div>
  <label className="block text-sm text-gray-700 mb-1.5">Ghi chú đơn hàng</label>
  <input
    type="text"
    value={customerInfo.notes || ''}
    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
    className="w-full mg-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
    placeholder="Lưu ý với cửa hàng"
  />
</div>
                {/* Voucher */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <VoucherSelector
                    totalAmount={subtotal}
                    onVoucherApply={handleVoucherApply}
                    selectedVoucher={selectedVoucher}
                  />
                </div>

                {/* Tổng tiền */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>VAT (1%):</span>
                    <span className="font-medium">{formatCurrency(vatAmount)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-medium">
                      {shippingFee === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Tổng cộng:</span>
                      <span className="text-xl font-bold text-blue-700">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút đặt hàng */}
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>Đặt hàng</span>
                    </>
                  )}
                </button>

                {/* Thông tin phí ship */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2 text-xs text-blue-800">
                    <Truck size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Chính sách vận chuyển:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Miễn phí ship cho đơn hàng từ 1.000.000đ</li>
                        <li>• Giảm 20.000đ ship cho đơn từ 500.000đ</li>
                        <li>• Giao hàng trong 2-3 ngày</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                    