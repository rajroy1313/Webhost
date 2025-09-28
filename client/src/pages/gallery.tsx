import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { BotCard } from "@/components/bot-card";
import { Bot } from "@shared/schema";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function Gallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: bots = [], isLoading } = useQuery<Bot[]>({
    queryKey: ["/api/gallery", searchQuery, selectedCategory],
  });

  const categories = ["All Categories", "Music", "Moderation", "Games", "Utility", "Fun"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will automatically refetch due to the searchQuery dependency
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <Sidebar botCount={0} />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar botCount={0} />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="title-gallery">
                  Bot Gallery
                </h2>
                <p className="text-muted-foreground mt-1">
                  Discover and explore community bots
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    placeholder="Search bots..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64"
                    data-testid="input-search"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </form>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gallery Grid */}
            {bots.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No bots found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory
                    ? "Try adjusting your search criteria"
                    : "No public bots available yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {bots.map((bot) => (
                    <BotCard
                      key={bot.id}
                      bot={{
                        ...bot,
                        author: "developer", // Mock data since we don't have user relations
                        servers: Math.floor(Math.random() * 5000).toString(), // Mock server count
                      }}
                      isPublic={true}
                      onViewDetails={() => console.log("View details for", bot.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-primary text-primary-foreground"
                      data-testid="button-current-page"
                    >
                      {currentPage}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(2)}
                      data-testid="button-page-2"
                    >
                      2
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(3)}
                      data-testid="button-page-3"
                    >
                      3
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </nav>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
