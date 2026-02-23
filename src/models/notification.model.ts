// SHARED: Keep in sync with nodejs-backend/src/models/notification.model.ts
import { model, Schema, Document, Types } from 'mongoose';

const DOCUMENT_NAME = 'Notification';
const COLLECTION_NAME = 'Notifications';

export interface INotification extends Document {
    noti_type: 'ORDER-001' | 'ORDER-002' | 'PROMOTION-001' | 'SHOP-001';
    noti_senderId: Types.ObjectId;
    noti_receivedId: number;
    noti_content: string;
    noti_options?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        noti_type: {
            type: String,
            enum: ['ORDER-001', 'ORDER-002', 'PROMOTION-001', 'SHOP-001'],
            required: true,
        },
        noti_senderId: { type: Schema.Types.ObjectId, required: true, ref: 'Shop' },
        noti_receivedId: { type: Number, required: true },
        noti_content: { type: String, required: true },
        noti_options: { type: Object, default: {} },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
);

export default model<INotification>(DOCUMENT_NAME, notificationSchema);
