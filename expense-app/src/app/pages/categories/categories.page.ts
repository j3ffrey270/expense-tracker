import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  pricetagsOutline,
  addOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
  cashOutline,
  laptopOutline,
  trendingUpOutline,
  fastFoodOutline,
  carOutline,
  receiptOutline,
  bagHandleOutline,
  filmOutline,
  giftOutline,
  medicalOutline,
  fitnessOutline,
  schoolOutline,
  searchOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { Category, TransactionType } from '../../core/models/category.model';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonIcon
  ]
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  selectedTypeTab: 'all' | 'income' | 'expense' = 'all';
  searchQuery = '';

  showAddModal = false;
  newCatName = '';
  newCatType: TransactionType = 'expense';
  newCatColor = '#4f46e5';
  newCatIcon = 'pricetags-outline';

  colorOptions: string[] = [
    '#4f46e5', '#10b981', '#ef4444', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#3b82f6', '#64748b', '#d97706', '#059669'
  ];

  iconOptions: string[] = [
    'cash-outline', 'fast-food-outline', 'car-outline',
    'receipt-outline', 'bag-handle-outline', 'film-outline',
    'laptop-outline', 'trending-up-outline', 'gift-outline',
    'medical-outline', 'fitness-outline', 'school-outline'
  ];

  categoryToDelete: Category | null = null;
  showDeleteModal = false;

  constructor(
    private transactionService: TransactionService,
    private toastService: ToastService
  ) {
    addIcons({
      pricetagsOutline,
      addOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline,
      cashOutline,
      laptopOutline,
      trendingUpOutline,
      fastFoodOutline,
      carOutline,
      receiptOutline,
      bagHandleOutline,
      filmOutline,
      giftOutline,
      medicalOutline,
      fitnessOutline,
      schoolOutline,
      searchOutline,
      closeCircleOutline
    });
  }

  ngOnInit(): void {
    this.transactionService.categories$.subscribe((list) => {
      this.categories = list;
      this.applyFilter();
    });
  }

  setFilterTab(tab: 'all' | 'income' | 'expense'): void {
    this.selectedTypeTab = tab;
    this.applyFilter();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    let list = this.categories;
    if (this.selectedTypeTab !== 'all') {
      list = list.filter((c) => c.type === this.selectedTypeTab);
    }
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.name.toLowerCase().includes(query));
    }
    this.filteredCategories = list;
  }

  openAddModal(): void {
    this.newCatName = '';
    this.newCatType = 'expense';
    this.newCatColor = '#4f46e5';
    this.newCatIcon = 'pricetags-outline';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  selectColor(color: string): void {
    this.newCatColor = color;
  }

  selectIcon(icon: string): void {
    this.newCatIcon = icon;
  }

  async saveCategory(): Promise<void> {
    if (!this.newCatName.trim()) {
      await this.toastService.show('Please enter a category name.', 'warning');
      return;
    }

    await this.transactionService.addCustomCategory({
      name: this.newCatName.trim(),
      type: this.newCatType,
      color: this.newCatColor,
      icon: this.newCatIcon
    });

    await this.toastService.show(`Category "${this.newCatName.trim()}" created successfully!`, 'success');
    this.closeAddModal();
  }

  confirmDeleteCategory(cat: Category): void {
    this.categoryToDelete = cat;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.categoryToDelete = null;
  }

  async deleteCategory(): Promise<void> {
    if (!this.categoryToDelete) return;

    await this.transactionService.deleteCategory(this.categoryToDelete.id);
    await this.toastService.show(`Category "${this.categoryToDelete.name}" deleted.`, 'info');
    this.closeDeleteModal();
  }
}
