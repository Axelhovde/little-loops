import React from "react" 
import { cn } from "@/lib/utils"
import { ItemColor } from "@/interfaces/types"

interface ColorSwatchProps {
  colors: ItemColor[]
  selectedColor: ItemColor
  onSelect: (color: ItemColor) => void
}

const ColorSwatches: React.FC<ColorSwatchProps> = ({ colors, selectedColor, onSelect }) => {
  return (
    <div className="flex flex-wrap">
      {colors.map((color) => {
        const isSelected = selectedColor.id === color.id

        return (
          <button
            key={color.id}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(color)
            }}
            className={cn(
              "relative w-4 h-4 m-1 rounded-full transition-none",
              isSelected && "scale-110"
            )}
            style={{
              backgroundColor: color.hex || "#ccc",
              border: "none",
              position: "relative",
            }}
          >
            {isSelected && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: "2px solid white", // inner white border
                  boxShadow: `0 0 0 1px ${color.hex || "#ccc"}`, // outer ring same color as circle
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default ColorSwatches
