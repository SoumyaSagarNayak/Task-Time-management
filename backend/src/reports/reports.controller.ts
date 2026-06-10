import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('time-by-task')
    getTimeByTask(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.reportsService.getTimeByTask(
            new Date(startDate),
            new Date(endDate),
        );
    }

    @Get('user-productivity')
    getUserProductivity(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
    ) {
        return this.reportsService.getUserProductivity(
            new Date(startDate),
            new Date(endDate),
            groupBy || 'day',
        );
    }

    @Get('billable-vs-nonbillable')
    getBillableVsNonBillable(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
    ) {
        return this.reportsService.getBillableVsNonBillable(
            new Date(startDate),
            new Date(endDate),
            groupBy || 'week',
        );
    }

    @Get('summary')
    getSummary(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.reportsService.getSummary(
            new Date(startDate),
            new Date(endDate),
        );
    }
}
