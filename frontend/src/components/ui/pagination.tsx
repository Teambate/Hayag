import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number
  totalPages: number
  siblingCount?: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  siblingCount = 1,
  onPageChange,
  className,
  ...props
}: PaginationProps) {
  // Generate pagination items
  const generatePaginationItems = () => {
    // If total pages is less than or equal to 7, we show all pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Basic range
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    // Whether to show dots on left/right sides
    const showLeftDots = leftSiblingIndex > 2
    const showRightDots = rightSiblingIndex < totalPages - 1

    // Generate final items array
    const items: (number | string)[] = []

    // Always include first page
    items.push(1)

    // Handle left side with dots if needed
    if (showLeftDots) {
      items.push("left-dots")
    } else if (currentPage > 2) {
      items.push(2)
    }

    // Add sibling pages and current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        items.push(i)
      }
    }

    // Handle right side with dots if needed
    if (showRightDots) {
      items.push("right-dots")
    } else if (currentPage < totalPages - 1) {
      items.push(totalPages - 1)
    }

    // Always include last page
    if (totalPages > 1) {
      items.push(totalPages)
    }

    return items
  }

  const items = generatePaginationItems()

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    >
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {items.map((item, index) => {
          // Handle dot items
          if (item === "left-dots" || item === "right-dots") {
            return (
              <div
                key={`dots-${index}`}
                className="flex h-8 w-8 items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4" />
              </div>
            )
          }

          // Handle number items
          return (
            <Button
              key={item}
              variant={currentPage === item ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                currentPage === item && "bg-[#65B08F] hover:bg-[#65B08F]/90" // Use green theme color
              )}
              onClick={() => onPageChange(Number(item))}
            >
              <span className="sr-only">Go to page {item}</span>
              {item}
            </Button>
          )
        })}
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
} 