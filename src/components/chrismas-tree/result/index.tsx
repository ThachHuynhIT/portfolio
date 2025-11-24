import Navbar from '@/components/client-navbar';
import { decrypt } from '@/hooks/OpenSSLDecryptionService';
import SelectQR from '@/pages/views/select-qr-type';
import { useEffect, useState } from 'react';

interface IMyReactComponentProps {
    encryptedData: string;
}

interface IHeartFormResultProps {
    id?: string;
}

export default function MemoriesFormResult({ encryptedData }: IMyReactComponentProps) {
    const [qrText, setQrText] = useState<string>('');

    useEffect(() => {
        if (!encryptedData) {
            return;
        }

        const decryptedData: IHeartFormResultProps = decrypt(encryptedData);

        if (decryptedData.id) {
            setQrText(`${window.location.origin}/chrismas-tree/${decryptedData.id}`);
        }
    }, [encryptedData]);

    return (
        <main className="flex min-h-screen flex-col bg-white">
            <Navbar />
            <div className="flex w-full flex-1 items-center justify-center sm:pt-1">
                <div className="flex h-full w-full flex-col bg-white shadow-md sm:max-w-md sm:rounded-xl">
                    <div className="flex flex-col items-center justify-center p-6">
                        <SelectQR value={qrText} />
                    </div>
                </div>
            </div>
        </main>
    );
}
