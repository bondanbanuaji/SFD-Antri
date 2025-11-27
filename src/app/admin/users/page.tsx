'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Users,
    Plus,
    Pencil,
    Trash2,
    Search,
    Loader2,
    X,
    Shield,
    User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    username: string;
    name: string;
    role: 'ADMIN' | 'PETUGAS';
    loket?: {
        id: number;
        name: string;
        status: string;
    } | null;
    createdAt: string;
}

interface Loket {
    id: number;
    name: string;
    status: string;
    userId: string | null;
    user: any;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [lokets, setLokets] = useState<Loket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'PETUGAS' as 'ADMIN' | 'PETUGAS',
        loketId: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchLokets();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users');
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            toast.error('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    const fetchLokets = async () => {
        try {
            const res = await fetch('/api/loket');
            const data = await res.json();
            if (data.success) {
                setLokets(data.data);
            }
        } catch (error) {
            console.error('Error fetching lokets:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PATCH' : 'POST';

            const payload: any = {
                name: formData.name,
                role: formData.role,
            };

            if (!editingUser) {
                payload.username = formData.username;
                payload.password = formData.password;
            } else if (formData.password) {
                payload.password = formData.password;
            }

            if (formData.loketId) {
                payload.loketId = formData.loketId;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success || res.ok) {
                toast.success(editingUser ? 'User berhasil diupdate' : 'User berhasil dibuat');
                setShowModal(false);
                resetForm();
                fetchUsers();
                fetchLokets();
            } else {
                toast.error(data.error?.message || data.message || 'Gagal menyimpan user');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            name: user.name,
            role: user.role,
            loketId: user.loket?.id.toString() || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (userId: string) => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success || res.ok) {
                toast.success('User berhasil dihapus');
                fetchUsers();
                fetchLokets();
            } else {
                toast.error(data.error?.message || 'Gagal menghapus user');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
            setDeleteConfirm(null);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            name: '',
            role: 'PETUGAS',
            loketId: '',
        });
        setEditingUser(null);
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const availableLokets = lokets.filter(
        (loket) => !loket.userId || loket.userId === editingUser?.id
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-b border-blue-700/50 shadow-xl">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-black text-white drop-shadow-lg"
                            >
                                Kelola Akun User
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-blue-100 mt-2 text-lg"
                            >
                                Manajemen user dan operator loket
                            </motion.p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                size="lg"
                                className="gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah User Baru
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Search & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="col-span-2 border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    placeholder="Cari user..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-12 text-lg"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80 mb-1">Total User</p>
                                    <p className="text-4xl font-black text-white">{users.length}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80 mb-1">Operator</p>
                                    <p className="text-4xl font-black text-white">
                                        {users.filter((u) => u.role === 'PETUGAS').length}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <UserIcon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="border-0 shadow-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-b">
                        <CardTitle className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-6 h-6" />
                            Daftar User ({filteredUsers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-gray-800 border-b">
                                        <tr>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300">
                                                Username
                                            </th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300">
                                                Nama Lengkap
                                            </th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300">
                                                Role
                                            </th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300">
                                                Loket
                                            </th>
                                            <th className="text-right py-4 px-6 font-bold text-gray-700 dark:text-gray-300">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {filteredUsers.map((user, index) => (
                                                <motion.tr
                                                    key={user.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                                >
                                                    <td className="py-4 px-6">
                                                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                                            {user.username}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="font-semibold text-gray-900 dark:text-white">
                                                            {user.name}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span
                                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                                                                user.role === 'ADMIN'
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                                            }`}
                                                        >
                                                            {user.role === 'ADMIN' ? (
                                                                <Shield className="w-4 h-4" />
                                                            ) : (
                                                                <UserIcon className="w-4 h-4" />
                                                            )}
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {user.loket ? (
                                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                                                                {user.loket.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                onClick={() => handleEdit(user)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-2"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                                Edit
                                                            </Button>
                                                            {deleteConfirm === user.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        onClick={() => handleDelete(user.id)}
                                                                        size="sm"
                                                                        disabled={submitting}
                                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                                    >
                                                                        {submitting ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            'Yakin'
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => setDeleteConfirm(null)}
                                                                        size="sm"
                                                                        variant="outline"
                                                                    >
                                                                        Batal
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => setDeleteConfirm(user.id)}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Hapus
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>

                                {filteredUsers.length === 0 && !loading && (
                                    <div className="text-center py-20 text-gray-500">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-semibold">Tidak ada user ditemukan</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal Create/Edit */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setShowModal(false);
                            resetForm();
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-3xl font-black text-white">
                                        {editingUser ? 'Edit User' : 'Tambah User Baru'}
                                    </h2>
                                    <p className="text-blue-100 mt-1">
                                        {editingUser ? 'Update informasi user' : 'Buat akun user baru'}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-lg font-bold">
                                            Username *
                                        </Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) =>
                                                setFormData({ ...formData, username: e.target.value })
                                            }
                                            disabled={!!editingUser}
                                            required={!editingUser}
                                            placeholder="username"
                                            className="h-12 text-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-lg font-bold">
                                            Nama Lengkap *
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="Nama lengkap"
                                            className="h-12 text-lg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-lg font-bold">
                                        Password {editingUser ? '(kosongkan jika tidak diubah)' : '*'}
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        placeholder="••••••••"
                                        className="h-12 text-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-lg font-bold">
                                            Role *
                                        </Label>
                                        <select
                                            id="role"
                                            value={formData.role}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    role: e.target.value as 'ADMIN' | 'PETUGAS',
                                                })
                                            }
                                            required
                                            className="w-full h-12 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg"
                                        >
                                            <option value="PETUGAS">PETUGAS (Operator Loket)</option>
                                            <option value="ADMIN">ADMIN (Administrator)</option>
                                        </select>
                                    </div>

                                    {formData.role === 'PETUGAS' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="loketId" className="text-lg font-bold">
                                                Assign Loket
                                            </Label>
                                            <select
                                                id="loketId"
                                                value={formData.loketId}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, loketId: e.target.value })
                                                }
                                                className="w-full h-12 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg"
                                            >
                                                <option value="">Tidak di-assign</option>
                                                {availableLokets.map((loket) => (
                                                    <option key={loket.id} value={loket.id}>
                                                        {loket.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        variant="outline"
                                        size="lg"
                                        disabled={submitting}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={submitting}
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                {editingUser ? 'Update User' : 'Buat User'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
