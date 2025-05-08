"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ContractsListProps {
  onContractClick?: () => void
}

export function ContractsList({ onContractClick }: ContractsListProps) {
  const router = useRouter()
  const [selectedContract, setSelectedContract] = useState("1")

  // Sample contracts data
  const contracts = [
    {
      id: "1",
      name: "Wohngebäude München-Schwabing",
      client: "Stadt München",
      date: "15.04.2023",
      riskLevel: "high",
    },
    {
      id: "2",
      name: "Bürogebäude Frankfurt",
      client: "Immobilien GmbH",
      date: "02.03.2023",
      riskLevel: "medium",
    },
    {
      id: "3",
      name: "Schulgebäude Berlin",
      client: "Berliner Schulbau",
      date: "18.02.2023",
      riskLevel: "low",
    },
    {
      id: "4",
      name: "Brückensanierung Hamburg",
      client: "Hansestadt Hamburg",
      date: "05.01.2023",
      riskLevel: "medium",
    },
    {
      id: "5",
      name: "Einkaufszentrum Köln",
      client: "Retail Invest AG",
      date: "12.12.2022",
      riskLevel: "high",
    },
    {
      id: "6",
      name: "Krankenhaus Erweiterung Stuttgart",
      client: "Klinikum Stuttgart",
      date: "28.11.2022",
      riskLevel: "medium",
    },
    {
      id: "7",
      name: "Industriehalle Nürnberg",
      client: "Industrie Solutions GmbH",
      date: "15.10.2022",
      riskLevel: "low",
    },
    {
      id: "8",
      name: "Hotelkomplex Dresden",
      client: "Hotel Group International",
      date: "02.09.2022",
      riskLevel: "medium",
    },
  ]

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return (
          <Badge variant="destructive" className="ml-auto">
            Hohes Risiko
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 ml-auto">
            Mittleres Risiko
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 ml-auto">
            Niedriges Risiko
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className={`p-3 cursor-pointer transition-colors ${
              selectedContract === contract.id
                ? "bg-primary/10 border-l-4 border-primary"
                : "hover:bg-muted/50 border-l-4 border-transparent"
            }`}
            onClick={() => {
              setSelectedContract(contract.id)
              if (onContractClick) onContractClick()
              router.push(`/analytik/${contract.id}`)
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText
                className={`h-5 w-5 ${selectedContract === contract.id ? "text-primary" : "text-muted-foreground"}`}
              />
              <h3 className="font-medium line-clamp-1">{contract.name}</h3>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground pl-8">
              <span>{contract.client}</span>
              {getRiskIcon(contract.riskLevel)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pl-8">
              <span>{contract.date}</span>
              {getRiskBadge(contract.riskLevel)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
