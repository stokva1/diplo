import {
    BadRequestException,
    Body,
    Controller, Delete,
    Get, HttpCode, HttpStatus,
    Param,
    Post,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import {UploadFileDto} from "./dto/upload-file.dto";
import {Throttle} from "@nestjs/throttler";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

function ensureUploadDirectoryExists() {
    const uploadDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    return uploadDir;
}

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
];

function fileFilter(
    _request: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
            new BadRequestException('Unsupported file type.'),
            false,
        );
    }

    callback(null, true);
}

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post()
    @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (_request, _file, callback) => {
                    callback(null, ensureUploadDirectoryExists());
                },
                filename: (_request, file, callback) => {
                    const uniqueSuffix = `${Date.now()}-${Math.round(
                        Math.random() * 1e9,
                    )}`;
                    const extension = path.extname(file.originalname);
                    callback(null, `${uniqueSuffix}${extension}`);
                },
            }),
            limits: {
                fileSize: 10 * 1024 * 1024,
            },
            fileFilter,
        }),
    )
    upload(
        @Req() request: AuthenticatedRequest,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileDto,
    ) {
        return this.filesService.create(request.user, file, dto);
    }

    @Get(':fileId/download')
    async download(
        @Req() request: AuthenticatedRequest,
        @Param('fileId') fileId: string,
        @Res() response: Response,
    ) {
        const file = await this.filesService.findOne(request.user, fileId);

        response.setHeader('Content-Type', file.mimeType);
        response.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(file.fileName)}"`,
        );

        return response.sendFile(path.resolve(file.storageKey));
    }

    @Get(':fileId')
    metadata(
        @Req() request: AuthenticatedRequest,
        @Param('fileId') fileId: string,
    ) {
        return this.filesService.findMetadata(request.user, fileId);
    }

    @Delete(':fileId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Req() request: AuthenticatedRequest,
        @Param('fileId') fileId: string,
    ) {
        await this.filesService.delete(request.user, fileId);
    }
}