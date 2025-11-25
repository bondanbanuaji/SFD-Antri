import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, LayoutDashboard, Settings } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 mb-16">
          <h1 className="text-6xl font-bold text-white drop-shadow-lg">
            Sistem Antrian Digital
          </h1>
          <h2 className="text-3xl text-blue-100">
            Dinas Perhubungan
          </h2>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto">
            Sistem antrian modern berbasis web untuk layanan Angkutan Umum dan Angkutan Barang
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Link href="/kiosk">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 bg-white cursor-pointer h-full">
              <div className="space-y-4">
                <div className="bg-blue-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <Smartphone className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 text-center">
                  Kiosk
                </h3>
                <p className="text-gray-600 text-center">
                  Ambil nomor antrian
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/display">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 bg-white cursor-pointer h-full">
              <div className="space-y-4">
                <div className="bg-green-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <Monitor className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 text-center">
                  Display
                </h3>
                <p className="text-gray-600 text-center">
                  Layar tampilan antrian
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/loket">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 bg-white cursor-pointer h-full">
              <div className="space-y-4">
                <div className="bg-purple-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <LayoutDashboard className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 text-center">
                  Loket
                </h3>
                <p className="text-gray-600 text-center">
                  Dashboard petugas
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 bg-white cursor-pointer h-full">
              <div className="space-y-4">
                <div className="bg-orange-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <Settings className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 text-center">
                  Admin
                </h3>
                <p className="text-gray-600 text-center">
                  Laporan & manajemen
                </p>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <Link href="/login">
            <Button size="lg" variant="secondary" className="gap-2">
              Login Petugas / Admin
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
