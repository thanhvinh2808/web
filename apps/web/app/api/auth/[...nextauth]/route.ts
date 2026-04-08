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
    async jwt({ token, user, account }) {
      if (account && user) {
        try {
          let baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          if (baseApiUrl.includes('localhost')) {
            baseApiUrl = baseApiUrl.replace('localhost', '127.0.0.1');
          }
          const apiUrl = `${baseApiUrl}/google-login`;
          
          const response = await fetch(apiUrl, {
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
            return {
              accessToken: data.token,
              user: {
                id: data.user.id || data.user._id,
                email: data.user.email,
                role: data.user.role,
                name: data.user.name,
                avatar: data.user.avatar
              }
            };
          }
        } catch (error) {
          console.error("NextAuth sync error:", error);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.user = token.user;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
