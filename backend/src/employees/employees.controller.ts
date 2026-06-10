import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type CurrentUserData } from '../auth/decorators/current-user.decorator';
import { EmployeeListDto } from './dto/employee-list.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all active employees for dropdown' })
    @ApiResponse({ status: 200, description: 'List of active employees', type: [EmployeeListDto] })
    findAll(@CurrentUser() user: CurrentUserData) {
        return this.employeesService.findAllActive(user);
    }
}
