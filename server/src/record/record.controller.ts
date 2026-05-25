import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { RecordService } from './record.service'

@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  create(@Body() body: { flightNumber: string; action: string; detail: string }) {
    if (!body.flightNumber || !body.action) {
      return { code: 400, msg: '航班号和操作类型不能为空', data: null }
    }
    const record = this.recordService.create({
      flightNumber: body.flightNumber,
      action: body.action,
      detail: body.detail || ''
    })
    console.log(`[POST] /api/records - 记录: ${body.flightNumber} - ${body.action}`)
    return {
      code: 200,
      msg: 'success',
      data: record
    }
  }

  @Get()
  findAll() {
    const records = this.recordService.findAll()
    console.log(`[GET] /api/records - 返回 ${records.length} 条记录`)
    return {
      code: 200,
      msg: 'success',
      data: records
    }
  }

  @Get('flights')
  getFlightNumbers() {
    const flightNumbers = this.recordService.getFlightNumbers()
    const flightData = flightNumbers.map(flight => ({
      flightNumber: flight,
      recordCount: this.recordService.getRecordCountByFlight(flight),
      latestTime: this.recordService.getLatestTimeByFlight(flight)
    }))
    console.log(`[GET] /api/records/flights - 返回 ${flightData.length} 个航班`)
    return {
      code: 200,
      msg: 'success',
      data: flightData
    }
  }

  @Get('flight/:flightNumber')
  getRecordsByFlight(@Param('flightNumber') flightNumber: string) {
    const records = this.recordService.findByFlightNumber(flightNumber)
    console.log(`[GET] /api/records/flight/${flightNumber} - 返回 ${records.length} 条记录`)
    return {
      code: 200,
      msg: 'success',
      data: records
    }
  }
}
