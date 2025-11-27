'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SocketTestProps {
    socket: any;
    isConnected: boolean;
    room?: string;
}

export function SocketTest({ socket, isConnected, room }: SocketTestProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<Record<string, boolean>>({});

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
    };

    useEffect(() => {
        addLog(`Socket connection: ${isConnected ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}`);
    }, [isConnected]);

    const testSocketConnection = () => {
        addLog('🔍 Testing socket connection...');
        if (!socket) {
            addLog('❌ Socket object is null');
            setTestResults(prev => ({ ...prev, socketExists: false }));
            return;
        }

        addLog(`✅ Socket exists, ID: ${socket.id}`);
        addLog(`   - Connected: ${socket.connected}`);
        addLog(`   - Active: ${socket.active}`);
        
        setTestResults(prev => ({
            ...prev,
            socketExists: true,
            socketConnected: socket.connected,
            socketActive: socket.active,
        }));
    };

    const testRoomJoin = () => {
        if (!socket || !room) {
            addLog('❌ Cannot test room join: socket or room missing');
            return;
        }

        addLog(`🔍 Testing room join: ${room}`);
        socket.emit('join', room);
        addLog(`✅ Emitted join event for room: ${room}`);
        
        setTestResults(prev => ({ ...prev, roomJoined: true }));
    };

    const testEventListener = () => {
        if (!socket) {
            addLog('❌ Cannot test event listener: socket missing');
            return;
        }

        addLog('🔍 Testing event listener...');
        
        const testHandler = (data: any) => {
            addLog(`✅ Received test event! Data: ${JSON.stringify(data)}`);
            setTestResults(prev => ({ ...prev, eventListenerWorks: true }));
        };

        socket.on('test:response', testHandler);
        socket.emit('test:ping', { message: 'Hello from display' });
        addLog('📤 Sent test:ping event');

        setTimeout(() => {
            socket.off('test:response', testHandler);
        }, 5000);
    };

    const testQueueCalledListener = () => {
        if (!socket) {
            addLog('❌ Cannot test queue:called listener: socket missing');
            return;
        }

        addLog('🔍 Setting up queue:called listener...');
        
        const handler = (data: any) => {
            addLog(`✅ Received queue:called event!`);
            addLog(`   - Code: ${data.code}`);
            addLog(`   - Loket ID: ${data.loketId}`);
            addLog(`   - Loket: ${JSON.stringify(data.loket)}`);
            setTestResults(prev => ({ ...prev, queueCalledWorks: true }));
        };

        socket.on('queue:called', handler);
        addLog('✅ Listener registered for queue:called');
        addLog('   Now call a queue from loket page to test...');

        return () => {
            socket.off('queue:called', handler);
        };
    };

    const simulateQueueCalled = () => {
        if (!socket) {
            addLog('❌ Cannot simulate: socket missing');
            return;
        }

        const mockQueue = {
            id: 999,
            code: 'TEST-001',
            type: 'UMUM',
            status: 'CALLED',
            loketId: 1,
            loket: {
                id: 1,
                name: 'Loket 1'
            }
        };

        addLog('🧪 Simulating queue:called event...');
        socket.emit('test:simulate-queue-called', mockQueue);
        addLog(`📤 Sent test queue: ${mockQueue.code}`);
    };

    const clearLogs = () => {
        setLogs([]);
        setTestResults({});
    };

    return (
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                    🔧 Socket Debug Panel
                    <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Test Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={testSocketConnection} size="sm" variant="outline">
                        1. Test Connection
                    </Button>
                    <Button onClick={testRoomJoin} size="sm" variant="outline" disabled={!isConnected}>
                        2. Test Room Join
                    </Button>
                    <Button onClick={testEventListener} size="sm" variant="outline" disabled={!isConnected}>
                        3. Test Events
                    </Button>
                    <Button onClick={testQueueCalledListener} size="sm" variant="outline" disabled={!isConnected}>
                        4. Listen queue:called
                    </Button>
                    <Button onClick={simulateQueueCalled} size="sm" variant="outline" disabled={!isConnected}>
                        5. Simulate Queue
                    </Button>
                    <Button onClick={clearLogs} size="sm" variant="destructive">
                        Clear Logs
                    </Button>
                </div>

                {/* Test Results */}
                {Object.keys(testResults).length > 0 && (
                    <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                        <h4 className="text-sm font-bold mb-2">Test Results:</h4>
                        <div className="space-y-1 text-xs">
                            {Object.entries(testResults).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className={value ? 'text-green-600' : 'text-red-600'}>
                                        {value ? '✅' : '❌'}
                                    </span>
                                    <span>{key}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Logs */}
                <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="text-gray-500">Click test buttons above to start debugging...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))
                    )}
                </div>

                {/* Instructions */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p><strong>Instructions:</strong></p>
                    <p>1. Click "Test Connection" to verify socket is working</p>
                    <p>2. Click "Test Room Join" to join the display room</p>
                    <p>3. Click "Listen queue:called" to start listening</p>
                    <p>4. Go to Loket page and call a queue</p>
                    <p>5. Check if you receive the event in logs above</p>
                </div>
            </CardContent>
        </Card>
    );
}
