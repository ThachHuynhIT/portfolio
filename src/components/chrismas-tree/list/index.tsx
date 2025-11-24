import Pagination from '@/components/common/Pagination';
import { decrypt } from '@/hooks/OpenSSLDecryptionService';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import CommonListView from '@/pages/views/admin/list-view';
import QRCodeReader from '@/pages/views/admin/load-qrdata';
import { ColumnConfig, IPaginatedResponse, PaginationState } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
const MESSAGE_LIST_TITLE = 'QR Chrismas Tree';
const MESSAGE_LIST_TITLE_COLOR = '#000000ff';

interface IHeart {
    id: string;
    title: string;
    messages: string[];
    textColor: string;
    treeColor: string;
    created_at: string;
}

interface IHeartListProps {
    encryptedData: string;
}

export default function LetterList({ encryptedData }: IHeartListProps) {
    const [encrypted, setEncrypted] = useState<string>(encryptedData);
    const [listItem, setListItem] = useState<IHeart[]>([]);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [searchQR, setSearchQR] = useState<string | null>('');
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10, // Giá trị mặc định ban đầu
    });

    const messageColumns: ColumnConfig<IHeart>[] = [
        {
            key: 'id',
            label: 'STT',
            render: (item: IHeart, index: number) => {
                return (
                    <div key={index} className="text-gray-900">
                        {index + 1}
                    </div>
                );
            },
        },
        {
            key: 'title',
            label: 'Chữ trên cây',
            render: (item: IHeart, index: number) => {
                return (
                    <div key={index} style={{color: item.textColor}}>
                        {item.title}
                    </div>
                );
            },
        },
        {
            key: 'messages',
            label: 'Lời nhắn',
            render: (item: IHeart, index: number) => {
                return (
                    <div key={index} className="text-gray-900">
                        {item.messages && item.messages.map((text, i) => <p key={i}>{text}</p>)}
                    </div>
                );
            },
        },
        {
            key: 'created_at',
            label: 'Ngày tạo',
            render: (item: IHeart, index: number) => {
                return (
                    <div key={index} className="text-gray-900">
                        {formatDateString(item.created_at)}
                    </div>
                );
            },
        },
        {
            key: 'qr',
            label: 'QR code',
            render: (item: IHeart, index: number) => {
                return (
                    <a key={index} href={route('chrismas-tree-result', { id: item.id })}>
                        <QRCode key={`chrismas-tree-${index}`} value={`${window.location.origin}/chrismas-tree/${item.id}`} size={100} />
                    </a>
                );
            },
        },
        {
            key: 'action',
            label: '',
            render: (item: IHeart, index: number) => {
                return (
                    <div key={index}>
                        <a
                            href={route('edit-chrismas-tree-form', { id: item.id })}
                            className={`focus:ring-opacity-50 cursor-pointer rounded bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                        >
                            Chỉnh Sửa
                        </a>
                    </div>
                );
            },
        },
    ];

    useEffect(() => {
        if (!encrypted) return;

        const decryptedData: IPaginatedResponse<IHeart> = decrypt(encrypted);
        setListItem(decryptedData.data);
        setPagination({
            currentPage: decryptedData.current_page,
            totalPages: decryptedData.last_page,
            totalItems: decryptedData.total,
            itemsPerPage: decryptedData.per_page,
        });
    }, [encrypted]);

    const fetchClients = useCallback(async () => {
        try {
            const query: string = `/admin/chrismas-tree-filter?search=${encodeURIComponent(searchText ?? '')}&page=${pagination.currentPage}&per_page=${pagination.itemsPerPage}&qr=${searchQR ?? ''}`;

            const response = await fetch(query);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch data: ${response.status} - ${errorText}`);
            }

            const encryptedJson = await response.json();

            if (encryptedJson && encryptedJson.data) {
                setEncrypted(encryptedJson.data);
            } else {
                setEncrypted('');
                setListItem([]);
                setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: pagination.itemsPerPage });
            }
        } catch (err) {
            // Sử dụng 'any' cho lỗi để dễ dàng debug
            console.error('Error fetching clients:', err);
            setListItem([]);
            setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: pagination.itemsPerPage });
        }
    }, [searchText, pagination.currentPage, searchQR]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, currentPage: newPage }));
        }
    };

    const formatDateString = (dateString: string) => {
        if (!dateString) return;
        const dateObject = new Date(dateString);

        return dateObject.toLocaleString();
    };
    const handleChangeQR = (qrValue: string | null) => {
        setSearchQR(qrValue);
    };

    const ClearFilter = () => {
        setSearchQR(null);
        setSearchText(null);
    };

    return (
        <AppSidebarLayout>
            <div className="from-white-200 via-white-100 to-white-200 min-h-screen bg-white bg-gradient-to-br pb-5">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <h2 className="mb-4 text-2xl font-bold text-gray-800" style={{ color: MESSAGE_LIST_TITLE_COLOR }}>
                        {MESSAGE_LIST_TITLE}
                    </h2>
                    <div className="justify-content-between flex w-full items-end rounded-lg bg-white pb-2">
                        <div className="w-full">
                            <div className="justify-content-between flex w-full max-w-md">
                                <input
                                    type="search"
                                    id="searchInput"
                                    name="q"
                                    value={searchText ?? ''}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Tìm kiếm"
                                    className="my-2 w-full rounded-md border border-gray-300 pl-10 text-gray-900 focus:border-blue-200 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                />
                                <QRCodeReader setQRValue={handleChangeQR} />
                                <button
                                    onClick={ClearFilter}
                                    className="m-2 w-[250px] rounded-md bg-blue-500 px-4 py-2 text-center text-sm font-semibold text-nowrap text-white transition hover:bg-blue-700"
                                >
                                    Xóa lọc
                                </button>
                            </div>
                        </div>
                        <a
                            className={`focus:ring-opacity-50 w-auto cursor-pointer rounded bg-blue-500 px-4 py-2 text-sm font-medium text-nowrap text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                            href={route('chrismas-tree-form')}
                        >
                            Tạo mới
                        </a>
                    </div>
                    <CommonListView data={listItem} columns={messageColumns} />
                    <Pagination
                        totalItems={pagination.totalItems}
                        itemsPerPage={pagination.itemsPerPage}
                        currentPage={pagination.currentPage}
                        onPageChange={handlePageChange}
                        maxPageButtons={7} // Ví dụ: chỉ hiển thị tối đa 7 nút trang
                    />
                </div>
            </div>
        </AppSidebarLayout>
    );
}
