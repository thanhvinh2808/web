"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { ShoppingCart, CreditCard, Lock, User, Tag, CheckCircle, DiscAlbum } from 'lucide-react';
import { VoucherSelector } from '@/components/VoucherSelector';
import { Voucher } from '../types/voucher';
import { MapPin, Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
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
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // ✅ TỰ ĐỘNG ĐIỀN THÔNG TIN TỪ LOCALSTORAGE + CHECK typeof window
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const savedShippingInfo = localStorage.getItem('defaultShippingInfo');
      
      if (savedShippingInfo) {
        try {
          const parsedInfo = JSON.parse(savedShippingInfo);
          setCustomerInfo({
            fullName: parsedInfo.fullName || user.name || '',
            email: parsedInfo.email || user.email || '',
            phone: parsedInfo.phone || '',
            address: parsedInfo.address || '',
            city: parsedInfo.city || '',
            district: parsedInfo.district || '',
            ward: parsedInfo.ward || '',
            notes: parsedInfo.notes || ''

          });
          setStreetAddress(parsedInfo.address || '');
          setIsAutoFilled(true);
        } catch (error) {
          console.error('Error parsing saved shipping info:', error);
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
      } else {
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
  // Hàm load địa chỉ vào form
  const loadAddressToForm = async (address: any) => {
    setCustomerInfo({
      fullName: address.fullName,
      email: address.email,
      phone: address.phone,
      address: address.streetAddress,
      city: address.city,
      district: address.district,
      ward: address.ward,
      notes: address.notes
    });
    setStreetAddress(address.streetAddress);
    
    // Load Province
    setSelectedProvince(address.provinceCode || '');
    
    // Load Districts của Province đã chọn
    if (address.provinceCode) {
      try {
        const distResponse = await fetch(`https://provinces.open-api.vn/api/p/${address.provinceCode}?depth=2`);
        const distData = await distResponse.json();
        setDistricts(distData.districts || []);
        setSelectedDistrict(address.districtCode || '');
        
        // Load Wards của District đã chọn
        if (address.districtCode) {
          const wardResponse = await fetch(`https://provinces.open-api.vn/api/d/${address.districtCode}?depth=2`);
          const wardData = await wardResponse.json();
          setWards(wardData.wards || []);
          setSelectedWard(address.wardCode || '');
        }
      } catch (error) {
        console.error('Error loading address data:', error);
      }
    }
  };

 // ✅ Hàm lưu địa chỉ MỚI (cải tiến)
  const saveAddress = () => {
    if (!streetAddress || !selectedProvince || !selectedDistrict || !selectedWard) {
      toast.success('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    if (!customerInfo.fullName || !customerInfo.phone) {
      toast.success('Vui lòng điền họ tên và số điện thoại');
      return;
    }

    const provinceName = provinces.find(p => p.code == +selectedProvince)?.name || '';
    const districtName = districts.find(d => d.code == +selectedDistrict)?.name || '';
    const wardName = wards.find(w => w.code == +selectedWard)?.name || '';

    const newAddress = {
      id: Date.now().toString(),
      fullName: customerInfo.fullName,
      phone: customerInfo.phone,
      email: customerInfo.email,
      streetAddress: streetAddress,
      city: provinceName,
      district: districtName,
      ward: wardName,
      provinceCode: selectedProvince,
      districtCode: selectedDistrict,
      wardCode: selectedWard,
      isDefault: savedAddresses.length === 0, // Địa chỉ đầu tiên là mặc định
      createdAt: new Date().toISOString()
    };

    const updatedAddresses = [...savedAddresses, newAddress];
    setSavedAddresses(updatedAddresses);
    localStorage.setItem(`savedAddresses_${user?.id}`, JSON.stringify(updatedAddresses));
    
    setSelectedAddressId(newAddress.id);
    setIsEditingAddress(false);
    toast.success('✅ Đã lưu địa chỉ mới thành công!');
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

  // ✅ Hàm xóa địa chỉ
  const deleteAddress = (addressId: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
    
    // Nếu xóa địa chỉ mặc định, set địa chỉ đầu tiên làm mặc định
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

  // ✅ Tải danh sách Quận/Huyện
  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedProvince) {
        try {
          const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`);
          if (!response.ok) throw new Error('Failed to fetch districts');
          const data = await response.json();
          setDistricts(data.districts || []);
        } catch (error) {
          console.error("Lỗi khi tải danh sách quận/huyện:", error);
          setDistricts([]);
        }
      }
    };
    fetchDistricts();
    setSelectedDistrict('');
    setSelectedWard('');
    setWards([]);
  }, [selectedProvince]);

  // ✅ Tải danh sách Phường/Xã
  useEffect(() => {
    const fetchWards = async () => {
      if (selectedDistrict) {
        try {
          const response = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`);
          if (!response.ok) throw new Error('Failed to fetch wards');
          const data = await response.json();
          setWards(data.wards || []);
        } catch (error) {
          console.error("Lỗi khi tải danh sách phường/xã:", error);
          setWards([]);
        }
      }
    };
    fetchWards();
    setSelectedWard('');
  }, [selectedDistrict]);

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

    if (!streetAddress || !selectedProvince || !selectedDistrict || !selectedWard) {
      toast.success('Vui lòng điền đầy đủ thông tin địa chỉ (Số nhà, Tỉnh, Huyện, Xã).');
      return;
    }

    const provinceName = provinces.find(p => p.code == +selectedProvince)?.name || '';
    const districtName = districts.find(d => d.code == +selectedDistrict)?.name || '';
    const wardName = wards.find(w => w.code == +selectedWard)?.name || '';
    const fullAddress = `${streetAddress}, ${wardName}, ${districtName}, ${provinceName}`;

    setIsProcessing(true);

    try {
      if (typeof window !== 'undefined') {
        const shippingInfo = {
          fullName: customerInfo.fullName,
          phone: customerInfo.phone,
          email: customerInfo.email,
          address: streetAddress,
          city: provinceName,
          district: districtName,
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
          district: districtName,
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
        userId: user?.id
      };

      console.log('Order data:', orderData);

      let finalOrder;
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      if (API_URL) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (!token) {
          throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        }

        const response = await fetch(`${API_URL}/orders`, {
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
          onClick={() => router.push('/login')}
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
                  <MapPin size={18} className="text-red-500" />
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
                                    ? 'border-red-500 bg-red-50'
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
                                  className="mt-1 w-4 h-4 text-red-500 focus:ring-red-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900">{address.fullName}</span>
                                    <span className="text-gray-500">|</span>
                                    <span className="text-gray-600">{address.phone}</span>
                                    {address.isDefault && (
                                      <span className="px-2 py-0.5 text-xs border border-red-500 text-red-500 rounded">
                                        Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {address.streetAddress}, {address.ward}, {address.district}, {address.city}
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

                    {/* Tỉnh/Huyện/Xã */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          Tỉnh/Thành phố <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedProvince}
                          onChange={(e) => setSelectedProvince(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          required
                        >
                          <option value="">Chọn Tỉnh/TP</option>
                          {provinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          Quận/Huyện <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100"
                          disabled={!selectedProvince}
                          required
                        >
                          <option value="">Chọn Quận/Huyện</option>
                          {districts.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-700 mb-1.5">
                          Phường/Xã <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedWard}
                          onChange={(e) => setSelectedWard(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100"
                          disabled={!selectedDistrict}
                          required
                        >
                          <option value="">Chọn Phường/Xã</option>
                          {wards.map((ward) => (
                            <option key={ward.code} value={ward.code}>
                              {ward.name}
                            </option>
                          ))}
                        </select>
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
                    subtotal={subtotal}
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
                    <div className="flex justify-between text-red-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Tổng cộng:</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút đặt hàng */}
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    