"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle, Edit, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ContractSectionProps {
  section: {
    id: string
    title: string
    content: string
    risk: string
    needsRenegotiation?: boolean
    urgentAttention?: boolean
    removed?: boolean
  }
  isActive: boolean
  onClick: () => void
  onUpdate: (section: { id: string; title: string; content: string; risk: string }) => void
}

export function ContractSection({ section, isActive, onClick, onUpdate }: ContractSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(section.title)
  const [content, setContent] = useState(section.content)

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getRiskBorder = (risk: string, needsRenegotiation?: boolean, urgentAttention?: boolean) => {
    if (urgentAttention) {
      return "border-l-4 border-l-red-500 bg-red-50/50"
    }
    if (needsRenegotiation) {
      return "border-l-4 border-l-amber-500 bg-amber-50/50"
    }
    switch (risk) {
      case "high":
        return "border-l-4 border-l-red-500"
      case "medium":
        return "border-l-4 border-l-amber-500"
      case "low":
        return "border-l-4 border-l-green-500"
      default:
        return ""
    }
  }

  const handleSave = () => {
    onUpdate({ ...section, title, content })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitle(section.title)
    setContent(section.content)
    setIsEditing(false)
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isActive ? "ring-2 ring-primary ring-offset-2" : "",
        getRiskBorder(section.risk, section.needsRenegotiation, section.urgentAttention),
        section.removed ? "opacity-70" : "",
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {getRiskIcon(section.risk)}
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 font-medium"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="font-medium">{section.title}</h3>
          )}
          {section.removed && (
            <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-700">
              Entfernt
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Abbrechen
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Speichern
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] font-normal"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{section.content}</p>
        )}
      </CardContent>
    </Card>
  )
}
