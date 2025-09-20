// CategoryCreator.tsx - 카테고리 신규등록 버튼과 모달 컴포넌트
import { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import CategoryModal from "./CategoryModal";
import type { CreateMCPCategory } from "../../type";
import { DEFAULT_CATEGORY } from "../../constants/categoryConstants";

interface CategoryCreatorProps {
  onCreateCategory: (
    category: CreateMCPCategory
  ) => Promise<{ success: boolean; error?: string }>;
}

const CategoryCreator = ({ onCreateCategory }: CategoryCreatorProps) => {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] =
    useState<CreateMCPCategory>(DEFAULT_CATEGORY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => {
    setNewCategory({ ...DEFAULT_CATEGORY });
    setShowAddCategory(true);
  };

  const handleCloseModal = () => {
    setShowAddCategory(false);
    setNewCategory({ ...DEFAULT_CATEGORY });
  };

  const handleSubmit = async () => {
    if (!newCategory.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onCreateCategory(newCategory);
      if (result.success) {
        handleCloseModal();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">카테고리 관리</h5>
        <Button
          variant="primary"
          onClick={handleOpenModal}
          className="d-flex align-items-center"
        >
          <Plus className="me-1" size={16} />새 카테고리 추가
        </Button>
      </Card.Header>

      <CategoryModal
        show={showAddCategory}
        onHide={handleCloseModal}
        category={newCategory}
        onCategoryChange={setNewCategory}
        onSubmit={handleSubmit}
        title="새 카테고리 추가"
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default CategoryCreator;
