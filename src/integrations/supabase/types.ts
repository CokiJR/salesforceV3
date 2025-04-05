export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      collections: {
        Row: {
          amount: number
          bank_account: string | null
          created_at: string
          customer_id: string
          customer_name: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string | null
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_term: string | null
          status: string
          sync_status: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account?: string | null
          created_at?: string
          customer_id: string
          customer_name?: string | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_term?: string | null
          status?: string
          sync_status?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_term?: string | null
          status?: string
          sync_status?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          bank_account: string | null
          city: string
          contact_person: string
          created_at: string
          customer_id: string | null
          cycle: string
          email: string | null
          id: string
          location: Json | null
          name: string
          payment_term: string | null
          payment_term_description: string | null
          phone: string
          status: string
        }
        Insert: {
          address: string
          bank_account?: string | null
          city: string
          contact_person: string
          created_at?: string
          customer_id?: string | null
          cycle?: string
          email?: string | null
          id?: string
          location?: Json | null
          name: string
          payment_term?: string | null
          payment_term_description?: string | null
          phone: string
          status: string
        }
        Update: {
          address?: string
          bank_account?: string | null
          city?: string
          contact_person?: string
          created_at?: string
          customer_id?: string | null
          cycle?: string
          email?: string | null
          id?: string
          location?: Json | null
          name?: string
          payment_term?: string | null
          payment_term_description?: string | null
          phone?: string
          status?: string
        }
        Relationships: []
      }
      daily_routes: {
        Row: {
          created_at: string
          date: string
          id: string
          salesperson_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          salesperson_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          salesperson_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          total: number
        }
        Insert: {
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          total: number
        }
        Update: {
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          delivery_date: string
          id: string
          notes: string | null
          order_date: string
          payment_status: string
          route_stop_id: string | null
          salesperson_id: string
          status: string
          sync_status: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_date: string
          id?: string
          notes?: string | null
          order_date?: string
          payment_status: string
          route_stop_id?: string | null
          salesperson_id: string
          status: string
          sync_status?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_date?: string
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: string
          route_stop_id?: string | null
          salesperson_id?: string
          status?: string
          sync_status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account: string
          collection_id: string
          created_at: string
          customer_id: string
          id: string
          payment_date: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account: string
          collection_id: string
          created_at?: string
          customer_id: string
          id?: string
          payment_date: string
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account?: string
          collection_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          payment_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
          price: number
          sku: string
          stock: number
          unit: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          name: string
          price: number
          sku: string
          stock?: number
          unit: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sku?: string
          stock?: number
          unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          barcode_scanned: boolean
          coverage_status: string
          customer_id: string
          id: string
          notes: string | null
          route_id: string
          status: string
          visit_date: string
          visit_time: string
          visited: boolean
        }
        Insert: {
          barcode_scanned?: boolean
          coverage_status?: string
          customer_id: string
          id?: string
          notes?: string | null
          route_id: string
          status: string
          visit_date: string
          visit_time: string
          visited?: boolean
        }
        Update: {
          barcode_scanned?: boolean
          coverage_status?: string
          customer_id?: string
          id?: string
          notes?: string | null
          route_id?: string
          status?: string
          visit_date?: string
          visit_time?: string
          visited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "daily_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          id: string
          order_id: string | null
          payment_method: string
          status: string
          sync_status: string
          transaction_date: string
          transaction_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          payment_method: string
          status?: string
          sync_status?: string
          transaction_date?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          status?: string
          sync_status?: string
          transaction_date?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_customer_id: {
        Args: {
          old_id: string
          new_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
