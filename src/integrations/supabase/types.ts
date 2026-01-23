export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      collections: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string
          id: string
          is_reversed: boolean
          notes: string | null
          organization_id: string
          reverse_reason: string | null
          sale_id: string
        }
        Insert: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          id?: string
          is_reversed?: boolean
          notes?: string | null
          organization_id: string
          reverse_reason?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          id?: string
          is_reversed?: boolean
          notes?: string | null
          organization_id?: string
          reverse_reason?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "view_sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          balance: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          created_by: string | null
          distributor_id: string | null
          distributor_name: string
          id: string
          notes: string | null
          organization_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          distributor_id?: string | null
          distributor_name: string
          id?: string
          notes?: string | null
          organization_id: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          distributor_id?: string | null
          distributor_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string
        }
        Relationships: []
      }
      delivery_items: {
        Row: {
          created_at: string
          delivery_id: string
          id: string
          product_id: string
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          delivery_id: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string
          delivery_id?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
        }
        Relationships: []
      }
      developer_licenses: {
        Row: {
          days_valid: number | null
          expiryDate: string | null
          id: string
          issuedAt: string
          licenseKey: string
          orgName: string
          ownerId: string | null
          status: Database["public"]["Enums"]["license_status"]
          type: Database["public"]["Enums"]["license_type"]
        }
        Insert: {
          days_valid?: number | null
          expiryDate?: string | null
          id?: string
          issuedAt?: string
          licenseKey: string
          orgName: string
          ownerId?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          type?: Database["public"]["Enums"]["license_type"]
        }
        Update: {
          days_valid?: number | null
          expiryDate?: string | null
          id?: string
          issuedAt?: string
          licenseKey?: string
          orgName?: string
          ownerId?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          type?: Database["public"]["Enums"]["license_type"]
        }
        Relationships: []
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_employees: {
        Row: {
          activation_code: string
          created_at: string
          created_by: string | null
          employee_type: Database["public"]["Enums"]["employee_type"]
          id: string
          is_used: boolean
          name: string
          organization_id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          activation_code: string
          created_at?: string
          created_by?: string | null
          employee_type: Database["public"]["Enums"]["employee_type"]
          id?: string
          is_used?: boolean
          name: string
          organization_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          activation_code?: string
          created_at?: string
          created_by?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"]
          id?: string
          is_used?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          category: string
          cost_price: number
          created_at: string
          id: string
          is_deleted: boolean
          min_stock: number
          name: string
          organization_id: string
          stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string
          cost_price?: number
          created_at?: string
          id?: string
          is_deleted?: boolean
          min_stock?: number
          name: string
          organization_id: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          cost_price?: number
          created_at?: string
          id?: string
          is_deleted?: boolean
          min_stock?: number
          name?: string
          organization_id?: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          employee_type: Database["public"]["Enums"]["employee_type"] | null
          full_name: string
          id: string
          license_key: string | null
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          full_name: string
          id: string
          license_key?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          full_name?: string
          id?: string
          license_key?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          supplier_name: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          product_id: string
          product_name: string
          quantity: number
          supplier_name?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          supplier_name?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          sale_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "view_sales_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          customer_name: string
          grand_total: number
          id: string
          is_voided: boolean
          organization_id: string
          paid_amount: number
          payment_type: Database["public"]["Enums"]["payment_type"]
          remaining: number
          void_reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_name: string
          grand_total?: number
          id?: string
          is_voided?: boolean
          organization_id: string
          paid_amount?: number
          payment_type?: Database["public"]["Enums"]["payment_type"]
          remaining?: number
          void_reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_name?: string
          grand_total?: number
          id?: string
          is_voided?: boolean
          organization_id?: string
          paid_amount?: number
          payment_type?: Database["public"]["Enums"]["payment_type"]
          remaining?: number
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_customer_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_customer_balances: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string | null
          name: string | null
          organization_id: string | null
          phone: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      view_sales_summary: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          grand_total: number | null
          id: string | null
          is_voided: boolean | null
          organization_id: string | null
          paid_amount: number | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          remaining: number | null
          timestamp: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          grand_total?: number | null
          id?: string | null
          is_voided?: boolean | null
          organization_id?: string | null
          paid_amount?: number | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          remaining?: number | null
          timestamp?: never
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          grand_total?: number | null
          id?: string | null
          is_voided?: boolean | null
          organization_id?: string | null
          paid_amount?: number | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          remaining?: number | null
          timestamp?: never
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "view_customer_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_employee: {
        Args: { p_activation_code: string; p_user_id: string }
        Returns: undefined
      }
      add_collection_rpc: {
        Args: { p_amount: number; p_notes?: string; p_sale_id: string }
        Returns: string
      }
      add_employee_rpc: {
        Args: {
          p_name: string
          p_phone: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_type: Database["public"]["Enums"]["employee_type"]
        }
        Returns: string
      }
      add_purchase_rpc: {
        Args: {
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_supplier_name?: string
          p_unit_price: number
        }
        Returns: string
      }
      create_delivery_rpc: {
        Args: { p_distributor_name: string; p_items: Json; p_notes?: string }
        Returns: string
      }
      create_sale_rpc: {
        Args: { p_customer_id: string; p_items: Json }
        Returns: string
      }
      developer_exists: { Args: never; Returns: boolean }
      generate_license_key: { Args: never; Returns: string }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_license_rpc: {
        Args: {
          p_days?: number
          p_org_name: string
          p_type: Database["public"]["Enums"]["license_type"]
        }
        Returns: string
      }
      reverse_payment_rpc: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: undefined
      }
      use_license: {
        Args: { p_license_key: string; p_user_id: string }
        Returns: undefined
      }
      void_sale_rpc: {
        Args: { p_reason: string; p_sale_id: string }
        Returns: undefined
      }
    }
    Enums: {
      employee_type: "FIELD_AGENT" | "ACCOUNTANT"
      license_status: "READY" | "ACTIVE" | "SUSPENDED" | "EXPIRED"
      license_type: "TRIAL" | "PERMANENT"
      payment_type: "CASH" | "CREDIT"
      user_role: "DEVELOPER" | "OWNER" | "EMPLOYEE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      employee_type: ["FIELD_AGENT", "ACCOUNTANT"],
      license_status: ["READY", "ACTIVE", "SUSPENDED", "EXPIRED"],
      license_type: ["TRIAL", "PERMANENT"],
      payment_type: ["CASH", "CREDIT"],
      user_role: ["DEVELOPER", "OWNER", "EMPLOYEE"],
    },
  },
} as const
