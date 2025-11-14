interface IDialogNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string | null;
    isWait: boolean;
}

const DialogNotification: React.FC<IDialogNotificationProps> = ({ isOpen, onClose, message, isWait }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            style={{
                background: 'linear-gradient(0deg, rgba(73, 71, 72, 0.3), rgba(65, 63, 64, 0.3))',
            }}
            className="font-inter fixed inset-0 z-50 flex items-center justify-center"
        >
            {!isWait ? (
                <div className="w-96 rounded-xl bg-white p-6 shadow-lg">
                    <p className="text-md text-red-500">{message}</p>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition duration-300 ease-in-out hover:bg-gray-400"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-96 rounded-xl bg-white p-6 text-center shadow-lg">
                    <p className="text-purple-800">Lời nhắn đang được tạo.</p>
                    <p className="text-purple-800">Hãy đợi chút nhé.</p>
                </div>
            )}
        </div>
    );
};

export default DialogNotification;
