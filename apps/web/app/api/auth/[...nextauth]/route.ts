import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Gửi thông tin sang Backend để tạo user hoặc lấy token của hệ thống
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: user.id
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Bạn có thể lưu token trả về từ backend vào session ở đây nếu cần
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error syncing Google user:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Bổ sung thêm dữ liệu vào session nếu cần
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
