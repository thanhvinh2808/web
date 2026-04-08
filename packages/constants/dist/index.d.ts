export declare const API_BASE_URL: string;
export declare const SOCKET_URL: string;
export declare const ORDER_STATUS: {
    readonly PENDING: "pending";
    readonly PROCESSING: "processing";
    readonly SHIPPED: "shipped";
    readonly DELIVERED: "delivered";
    readonly CANCELLED: "cancelled";
};
export declare const PAYMENT_STATUS: {
    readonly UNPAID: "unpaid";
    readonly PAID: "paid";
    readonly REFUNDED: "refunded";
};
export declare const USER_ROLES: {
    readonly USER: "user";
    readonly ADMIN: "admin";
};
export declare const PRODUCT_STATUS: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly OUT_OF_STOCK: "out_of_stock";
};
export declare const CONTACT_STATUS: {
    readonly PENDING: "pending";
    readonly REPLIED: "replied";
    readonly CLOSED: "closed";
};
export declare const ROUTES: {
    readonly HOME: "/";
    readonly PRODUCTS: "/products";
    readonly CART: "/cart";
    readonly CHECKOUT: "/checkout";
    readonly LOGIN: "/login";
    readonly REGISTER: "/register";
    readonly PROFILE: "/profile";
    readonly ORDERS: "/orders";
    readonly ADMIN: "/admin";
    readonly CONTACT: "/contact";
};
