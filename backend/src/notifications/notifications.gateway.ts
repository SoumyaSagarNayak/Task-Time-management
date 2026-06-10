import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map of userId -> Set of socketIds
    private connectedUsers = new Map<string, Set<string>>();
    private clerk;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.clerk = createClerkClient({
            secretKey: this.configService.get('CLERK_SECRET_KEY'),
        });
    }

    /**
     * Validates a socket handshake token
     */
    private async validateSocketToken(client: Socket): Promise<string | null> {
        const authHeader = client.handshake.headers.authorization || (client.handshake.auth?.token as string);
        if (!authHeader) return null;

        // Handle string format "Bearer <token>" or just "<token>"
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = JSON.parse(
                Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
            );

            if (!payload.sub) return null;

            // Ensure user exists in Prisma
            const user = await this.prisma.user.findUnique({
                where: { clerkId: payload.sub },
                select: { id: true, isActive: true },
            });

            if (!user || !user.isActive) return null;

            return user.id; // Return our internal DB userId, not clerkId
        } catch (e) {
            console.error('WebSocket validation error:', e.message);
            return null;
        }
    }

    async handleConnection(client: Socket) {
        const userId = await this.validateSocketToken(client);

        if (!userId) {
            return client.disconnect(true);
        }

        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }

        this.connectedUsers.get(userId)!.add(client.id);

        // Attach userId to the socket for easy removal during disconnect
        client.data.userId = userId;
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            const sockets = this.connectedUsers.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.connectedUsers.delete(userId);
                }
            }
        }
    }

    /**
     * Push an event to all connected sockets of a user
     */
    pushToUser(userId: string, event: string, payload: any) {
        const sockets = this.connectedUsers.get(userId);
        if (sockets) {
            sockets.forEach((socketId) => {
                this.server.to(socketId).emit(event, payload);
            });
        }
    }
}
