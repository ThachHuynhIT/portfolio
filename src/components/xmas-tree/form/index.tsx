import Navbar from '@/components/client-navbar';
import { IXmasTreeResponse, RgbColor } from '@/types';
import { Inertia } from '@inertiajs/inertia';
import { useEffect, useState } from 'react';
import MusicSelector from '../../music/music-input';
import { decrypt } from '@/hooks/OpenSSLDecryptionService';
import ColorPickerButton from '@/components/color-picker';

interface IEncryptedProp {
    encryptedData: string;
}

export default function MessageForm({ encryptedData }: IEncryptedProp) {
    const [errors, setErrors] = useState({});
    const [selectedMusic, setSelectedMusic] = useState('');
    const [selectedMusicId, setSelectedMusicId] = useState('');
    const [styleErrors, setStyleErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [shouldDeleteImage, setShouldDeleteImage] = useState<string>('');
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [textColor, setTextColor] = useState<RgbColor>({
        r: 0,
        g: 255,
        b: 255,
    });
    const [treeColor, setTreeColor] = useState<RgbColor>({
        r: 30,
        g: 144,
        b: 255,
    });
    const [id, setId] = useState('');

    const [messages, setMessages] = useState(
        Array.from({ length: 3 }, (_, i) => ({ number: i + 1, message: '' }))
    );

    useEffect(() => {
        if (!encryptedData) {
            return;
        }

        const decryptedData: IXmasTreeResponse = decrypt(encryptedData);
        if (decryptedData) {
            if (decryptedData.messages && Array.isArray(decryptedData.messages)) {
                let arr: any = [];
                for (let i = 0; i < decryptedData.messages.length; i++) {
                    const message = decryptedData.messages[i] ?? '';
                    arr.push({ number: i + 1, message: message })
                }
                setMessages(arr);
            }

            if (decryptedData.textColor) {
                setTextColor(decryptedData.textColor);
            }

            if (decryptedData.treeColor) {
                setTreeColor(decryptedData.treeColor);
            }

            if (decryptedData.title) {
                setTitle(decryptedData.title);
            }

            if (decryptedData.finalImage) {
                setImagePreviewUrl(`/proxy-drive/${decryptedData.finalImage}`);
				setShouldDeleteImage(decryptedData.finalImage);
            }

            setId(decryptedData.id);
        }
    }, [encryptedData]);

    const handleInputChange = (index: any, value: any) => {
        const newMessages = [...messages];
        newMessages[index].message = value;
        setMessages(newMessages);
    };

    const handleAddInput = () => {
        const newNumber = messages.length + 1;
        setMessages([...messages, { number: newNumber, message: '' }]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const newErrors = {};
        let hasError = false;

        messages.slice(0, 3).forEach((msg: any, index: any) => {
            if (!msg.message.trim()) {
                newErrors[index] = 'Vui lòng nhập nội dung.';
                hasError = true;
            }
        });

        setErrors(newErrors);

        if (hasError) {
            setLoading(false);
            return;
        }
        Inertia.post(
            route('xmas-tree-form-save'),
            {
                id: id,
                messages: messages.filter((msg) => msg.message.trim() !== '').map((msg) => msg.message),
                title: title,
                treeColor: JSON.stringify(treeColor),
                textColor: JSON.stringify(textColor),
                music: selectedMusic,
                musicId: selectedMusicId,
				finalImage: selectedImage,
				d_file: selectedImage ? shouldDeleteImage : ''
            },
            {
                onSuccess: () => {
                    setMessages(Array.from({ length: 5 }, (_, i) => ({ number: i + 1, message: '' })));
                    setTitle('');
                    setTextColor({ r: 0, g: 255, b: 255 });
                    setTreeColor({ r: 30, g: 144, b: 255 });
					setSelectedImage(null);
                    setErrors({});
                    setStyleErrors({});
                    setLoading(false);
                },
                onError: () => {
                    setLoading(false);
                },
            },
        );
    };

    useEffect(() => {
        if (selectedImage) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedImage);
        }
    }, [selectedImage]);

    return (
        <main className="flex min-h-screen flex-col bg-white">
            <Navbar />
            <div className="flex w-full flex-1 items-center justify-center sm:pt-1">
                <div className={`flex h-full w-full flex-col sm:max-w-md bg-white sm:rounded-xl h-screen pt-[4rem]`}>
                    <img
                        src="https://i.pinimg.com/736x/74/08/5e/74085e70bc99e80831c5513afc0d863a.jpg"
                        alt="Banner"
                        className="h-40 w-full object-cover sm:rounded-t-xl"
                    />

                    <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {messages.map((msg, index) => (
                                <div key={msg.number} className="mb-4">
                                    <label className="mb-1 block text-sm text-gray-700">
                                        <span className="mr-1 text-pink-500">|</span> Nhập lời bạn muốn nói
                                    </label>
                                    <input
                                        type="text"
                                        value={msg.message}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        placeholder={`Nhập nội dung ${msg.number}`}
                                        className={`focus: w-full border-0 border-b bg-transparent px-0 py-2 text-sm text-gray-900 placeholder-gray-400 ${errors[index] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors[index] && <p className="mt-1 text-sm text-red-500">{errors[index]}</p>}
                                </div>
                            ))}

                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700">
                                    <span className="mr-1 text-pink-500">|</span>Chữ tiêu đề cạnh cây thông
                                </label>
                                <div className="relative">
                                    <input
                                        value={title}
                                        placeholder="Nhập chữ tiêu đề cạnh cây thông (2 - 3 từ) (ví dụ: 'Merry Christmas')"
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={`focus: w-full border-0 border-b bg-transparent px-0 py-2 text-sm text-gray-900 placeholder-gray-400 ${styleErrors.title ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                </div>
                                {styleErrors.title && <p className="text-sm text-red-500">{styleErrors.title}</p>}
                            </div>

                            <div className="mb-4">
                                <ColorPickerButton color={textColor} isRgb={true} onChangeColor={setTextColor} label="Chọn màu chữ tiêu đề" />
                            </div>

                            <div className="mb-4">
                                <ColorPickerButton color={treeColor} isRgb={true} onChangeColor={setTreeColor} label="Chọn màu cây thông" />
                            </div>

                            <div className="mb-4">
								<label className="text-sm font-medium text-gray-700">
									<span className="mr-1 text-pink-500">|</span>Hình ảnh (bắt buộc)
								</label>
								<div className="relative w-full">
									<input
										type="file"
										accept=".jpg,.jpeg,.png,.webp"
										id="image-upload"
										onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)}
										className="hidden"
									/>
									<label
										htmlFor="image-upload"
										className="block w-full cursor-pointer border-b border-gray-300 bg-transparent py-2 text-sm text-gray-900 hover:text-pink-500 focus:border-pink-400 focus:ring-0"
									>
										{selectedImage ? `Đã chọn: ${selectedImage.name}` : 'Chọn 1 hình (JPG, PNG, WEBP)'}
									</label>
								</div>
								{styleErrors.image && <p className="text-sm text-red-500">{styleErrors.image}</p>}
                                {imagePreviewUrl && <img src={imagePreviewUrl} alt="Preview" className="mt-2 max-h-40 object-contain" />}
							</div>

                            <div className="mb-4">
                                <MusicSelector
                                    onFileChange={(file) => {
                                        setSelectedMusic(file);
                                    }}
                                    onSelectMusic={(musicId) => {
                                        setSelectedMusicId(musicId);
                                    }}
                                />

                                {/* {styleErrors.music && <p className="text-sm text-red-500">{styleErrors.music}</p>} */}
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleAddInput}
                                    className={`w-full flex-1 rounded-lg border border-pink-500 bg-white px-4 py-2 text-pink-500 transition hover:bg-pink-500 hover:text-white sm:w-auto`}
                                >
                                    + Thêm lời nhắn
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex-1 rounded-md bg-pink-500 px-4 py-2 font-semibold text-white transition hover:border-1 hover:border-pink-500 hover:bg-white hover:text-pink-500 sm:w-auto"
                                >
                                    {loading ? (
                                        <div role="status" className="flex items-center gap-2">
                                            <svg
                                                aria-hidden="true"
                                                className="h-5 w-5 animate-spin fill-white text-gray-200 dark:text-gray-600"
                                                viewBox="0 0 100 101"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                    fill="currentColor"
                                                />
                                                <path
                                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                    fill="currentFill"
                                                />
                                            </svg>
                                            <span>Đang gửi...</span>
                                        </div>
                                    ) : (
                                        'Gửi'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
