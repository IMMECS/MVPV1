import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
          
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="Your email"
                autoComplete="email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn-primary w-full"
            >
              Sign in
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account?</span>{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 