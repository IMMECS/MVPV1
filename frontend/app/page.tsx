import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  // In a real implementation, we would check if user is authenticated
  // and redirect to dashboard if they are
  const isAuthenticated = false;
  
  if (isAuthenticated) {
    redirect('/dashboard');
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold mt-10 mb-4">
            Document Validator for Swedish Company Law
          </h1>
          <p className="text-xl mb-8 max-w-2xl">
            Upload your documents and get instant feedback on compliance with ABL requirements.
          </p>
          
          <div className="flex space-x-4 mt-8">
            <Link href="/auth/login" className="btn-primary">
              Login
            </Link>
            <Link href="/auth/register" className="btn-secondary">
              Register
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
              <p>Securely upload your .docx or .pdf files for analysis.</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2">Automatic Validation</h2>
              <p>Get instant feedback on compliance with ABL requirements.</p>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-2">Detailed Reports</h2>
              <p>Receive comprehensive reports highlighting compliance and deviations.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 