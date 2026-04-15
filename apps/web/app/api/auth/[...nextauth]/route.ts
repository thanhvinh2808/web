import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ✅ SENIOR FIX: Dùng JWT strategy và giữ cho nó cực kỳ nhẹ
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 ngày
  },
  secret: process.env.NEXTAUTH_SECRET || 'vinh-next-auth-secret-key-1234567890',
  
  callbacks: {
    async jwt({ token, account, user }) {
      // Chỉ thực hiện đồng bộ trong lần đăng nhập đầu tiên
      if (account && user) {
        try {
          let baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
          if (baseApiUrl.includes('localhost')) baseApiUrl = baseApiUrl.replace('localhost', '127.0.0.1');
          if (!baseApiUrl.endsWith('/api')) baseApiUrl = `${baseApiUrl.replace(/\/$/, '')}/api`;

          const response = await fetch(`${baseApiUrl}/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image || '',
              googleId: user.id
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // ✅ CHỈ LƯU ID VÀ TOKEN - KHÔNG LƯU AVATAR/DATA LỚN
            token.accessToken = data.token;
            token.sub = data.user.id || data.user._id;
          }
        } catch (error) {
          console.error("❌ NextAuth Sync Error:", error);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      // Session trả về cho client cũng phải nhẹ
      session.accessToken = token.accessToken;
      if (token.sub) {
        session.user = { id: token.sub };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
