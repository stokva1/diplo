import {IsNotEmpty, IsString, MaxLength} from "class-validator";

export class EmailVerificationConfirmDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    token: string;
}