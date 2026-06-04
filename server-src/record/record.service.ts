import { Injectable } from '@nestjs/common'

export interface OperationRecord {
  id: number
  flightNumber: string
  action: string
  detail: string
  timestamp: Date
}

@Injectable()
export class RecordService {
  private records: OperationRecord[] = []
  private nextId = 1

  create(data: { flightNumber: string; action: string; detail: string }): OperationRecord {
    const record: OperationRecord = {
      id: this.nextId++,
      flightNumber: data.flightNumber,
      action: data.action,
      detail: data.detail,
      timestamp: new Date()
    }
    this.records.unshift(record) // 最新的在最前面
    return record
  }

  findAll(): OperationRecord[] {
    return this.records
  }

  findByFlightNumber(flightNumber: string): OperationRecord[] {
    return this.records.filter(r => r.flightNumber === flightNumber)
  }

  getFlightNumbers(): string[] {
    const uniqueFlights = [...new Set(this.records.map(r => r.flightNumber))]
    return uniqueFlights.sort((a, b) => {
      // 按时间倒序，最新的航班号在前
      const aTime = Math.max(...this.records.filter(r => r.flightNumber === a).map(r => r.timestamp.getTime()))
      const bTime = Math.max(...this.records.filter(r => r.flightNumber === b).map(r => r.timestamp.getTime()))
      return bTime - aTime
    })
  }

  getRecordCountByFlight(flightNumber: string): number {
    return this.records.filter(r => r.flightNumber === flightNumber).length
  }

  getLatestTimeByFlight(flightNumber: string): Date | null {
    const flights = this.records.filter(r => r.flightNumber === flightNumber)
    if (flights.length === 0) return null
    return new Date(Math.max(...flights.map(r => r.timestamp.getTime())))
  }
}
